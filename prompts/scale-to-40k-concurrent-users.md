# Prompt: Scale ARL Airport Platform to 40,000 Concurrent Users

## Context

ARL Airport Platform is a Next.js 15 + Payload CMS 3 PWA for a regional airport (Plaine Corail, Rodrigues). The stack is:

- **Runtime:** Node.js 20, Next.js 15 (App Router, standalone output), Payload CMS 3
- **Database:** Supabase Postgres (external, `@payloadcms/db-postgres`)
- **Storage:** Supabase Storage (S3-compatible, `@payloadcms/storage-s3`)
- **Containerisation:** Docker multi-stage build, `docker-compose.yml` (currently single `app` container)
- **PWA:** Service worker with precaching of public routes, cache-first for static assets, network-first for navigation

The app currently runs as a **single container on port 3000** with no load balancer, no Redis, no CDN, and an **in-memory rate limiter** in `src/middleware.ts`. It can handle ~2K-5K concurrent users at best. The goal is to support **40,000 concurrent users** reliably.

---

## Task

Implement the following changes across the codebase. Each section is a discrete unit of work. Do not add unnecessary abstractions — keep changes minimal and production-ready.

---

### 1. Redis-Backed Rate Limiter (replace in-memory Map)

**File:** `src/middleware.ts`

The current rate limiter (lines 10-45) uses a `Map<string, RateBucket>` in process memory. This breaks with multiple instances because each container has its own Map.

**Changes:**
- Install `@upstash/ratelimit` and `@upstash/redis` (serverless Redis client that works in Next.js Edge Middleware).
- Replace the `rateBuckets` Map and `isRateLimited()` function with an Upstash sliding-window rate limiter.
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `src/lib/env.ts` under `serverEnv` (both required in production, optional in dev — fall back to a no-op limiter in dev if missing).
- Keep the same limits: 60 requests per 60-second window per IP.
- Keep the same response shape (429 JSON with `Retry-After` and `X-RateLimit-*` headers).

---

### 2. API Response Caching with Redis

**Files:** `src/app/api/flight-board/route.ts`, `src/app/api/weather/route.ts`

These two endpoints are the highest-traffic API routes (every frontend visitor polls them). They currently hit external APIs (AirLabs, Open-Meteo) on every request with no server-side caching.

**Changes:**
- Create a shared utility `src/lib/cache.ts` that exports a `cachedFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T>` function.
  - In production: use Upstash Redis (`GET`/`SET` with `EX`). Reuse the same `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env vars.
  - In development (no Redis configured): use a simple in-memory Map with TTL (fine for single-process dev).
- Wrap `getFlightBoard()` in `cachedFetch` with a **60-second TTL** in the flight-board route.
- Wrap `getWeatherSnapshot()` in `cachedFetch` with a **300-second (5 min) TTL** in the weather route.
- Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` header to the flight-board response.
- Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` header to the weather response.

---

### 3. Static Page Generation (ISR) for Public Frontend Pages

**Files:** All pages under `src/app/(frontend)/`

Public frontend pages (home, passenger guide, FAQs, notices, contact, etc.) are currently server-rendered on every request. At 40K concurrent users, this hammers the database.

**Changes:**
- Add `export const revalidate = 60` (or appropriate TTL) to each public frontend page so Next.js uses Incremental Static Regeneration (ISR). Suggested TTLs:
  - Home page (`page.tsx`): 60s
  - Notices, FAQs: 60s
  - Static info pages (contact, terms, accessibility, passenger guide, transport, etc.): 300s
  - Emergency services: 30s
- Add `export const dynamic = 'force-static'` where pages have no user-specific data.
- For the `[slug]` dynamic route, add `generateStaticParams()` that queries Payload for all published page slugs, so they are pre-built at build time and revalidated via ISR.

---

### 4. Production Docker Compose with Horizontal Scaling

**File:** Create `docker-compose.prod.yml` (do NOT modify the existing dev `docker-compose.yml`)

**Changes:**
- Define the `app` service using the production `runner` stage from the existing Dockerfile.
- Set `deploy.replicas: 10` (10 instances, each handling ~4K-5K connections).
- Add an `nginx` service as reverse proxy / load balancer:
  - Use `nginx:alpine` image.
  - Create `nginx/nginx.conf` with:
    - `upstream app` block pointing to `app:3000` (Docker Compose DNS handles round-robin across replicas).
    - `proxy_pass` to the upstream.
    - Connection limits: `worker_connections 4096`, `keepalive 64` to the upstream.
    - Gzip compression for `text/html`, `application/json`, `text/css`, `application/javascript`.
    - Static asset caching headers (`Cache-Control: public, max-age=31536000, immutable` for `/_next/static/`).
    - Health check endpoint pass-through to `/api/health`.
  - Expose port 80 (and 443 if TLS termination is desired).
- Add a `redis` service using `redis:7-alpine` for local/staging environments (production should use Upstash or managed Redis).
- Add appropriate `depends_on` and health checks.

---

### 5. Database Connection Pooling

**File:** `src/lib/env.ts`, documentation/`.env.example`

**Changes:**
- Add a comment in `src/lib/env.ts` next to `databaseURL` noting that production deployments MUST use the Supabase pooler URL (port 6543, transaction mode) for `DATABASE_URL`, and the direct connection (port 5432) for `DATABASE_DIRECT_URL` (used by migrations only).
- In `.env.example`, add clearly commented entries:
  ```
  # Production: Use Supabase connection pooler (PgBouncer) for app traffic
  # DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
  # DATABASE_DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].supabase.com:5432/postgres
  ```

---

### 6. HTTP Cache Headers for SSR/ISR Pages

**File:** `src/middleware.ts`

**Changes:**
- For public frontend routes (not `/admin`, not `/dashboard`, not `/api`), add a `Cache-Control` header to the response:
  ```
  Cache-Control: public, s-maxage=60, stale-while-revalidate=120
  ```
  This allows a CDN (Cloudflare, Vercel, AWS CloudFront) in front of the app to serve cached pages without hitting the origin server.
- For `/dashboard` and `/admin` routes, ensure `Cache-Control: private, no-store` is set.

---

### 7. Service Worker Enhancements for Reduced Server Load

**File:** `public/sw.js`

**Changes:**
- Add the flight-board and weather API responses to the service worker caching strategy:
  - Cache `/api/flight-board` and `/api/weather` responses with a **stale-while-revalidate** strategy: serve cached data immediately, fetch fresh data in the background, and update the cache.
  - Set a max cache age of 60s for flight data and 300s for weather data.
- This means repeat page views and tab-switches won't hit the server at all for these high-frequency endpoints.

---

### 8. Environment Variable Updates

**File:** `.env.example`

Add the following new environment variables with documentation comments:

```env
# ── Redis (Upstash) — required for production rate limiting and API caching ──
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Constraints

- **Do not** change the existing development `docker-compose.yml` — it should keep working as-is for local dev.
- **Do not** change the database schema or Payload collections.
- **Do not** introduce new frontend UI changes — this is infrastructure/backend only.
- **Do not** add monitoring/observability tooling (Prometheus, Grafana, etc.) — that is a separate initiative.
- **Do not** swap out the current tech stack (no Kubernetes, no serverless rewrites).
- Keep all changes compatible with the existing Dockerfile multi-stage build.
- All new dependencies must be compatible with Next.js Edge Runtime (middleware runs on Edge).

---

## Verification

After implementing, verify:

1. `pnpm build` succeeds with no errors.
2. `docker compose -f docker-compose.prod.yml up --build` starts Nginx + 10 app replicas + Redis.
3. The rate limiter works across multiple containers (hit `/api/flight-board` >60 times in 1 minute from one IP → 429).
4. Flight-board and weather responses include correct `Cache-Control` headers.
5. Public frontend pages return ISR headers (`x-nextjs-cache: HIT` after first request).
6. Existing E2E tests (`pnpm test:e2e`) pass without modification.
