# ARL Airport Platform — Deployment Guide

End-to-end deployment runbook for the ARL Airport Platform PWA: Next.js 15 +
Payload CMS 3, containerized, with Nginx in front of N replicas, Supabase
Postgres + Storage as external state, Upstash Redis for shared rate-limit /
cache, and CI/CD wired through GitHub Actions.

---

## 1. The big picture

The repo ships **two** deployment paths and they coexist:

| Path                  | Triggered by                                                     | Where it runs              |
| --------------------- | ---------------------------------------------------------------- | -------------------------- |
| **Manual**            | `docker compose -f docker-compose.prod.yml up --build -d`         | The production VPS         |
| **Automated (CI/CD)** | A push to `main` on GitHub                                       | GitHub → ghcr.io → VPS SSH |

The **automated** path is the canonical one. Manual is for first-time setup,
debugging, and emergencies.

The production stack (defined in `docker-compose.prod.yml`):

```
                ┌──────────────────────────────┐
   Internet  ─► │  arl-nginx  (ports 80/443)   │  TLS termination + load balance
                └──────────────┬───────────────┘
                               │  upstream "app" (Docker DNS round-robin)
                               ▼
            ┌─────────┬─────────┬─────────┬─────────┐
            │  app#1  │  app#2  │  app#3  │  app#N  │  Next.js standalone, port 3000
            └─────────┴─────────┴─────────┴─────────┘
                               │
                               ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ Supabase Postgres│  │ Supabase Storage │  │  Upstash Redis   │
        │  (PgBouncer 6543)│  │     (S3 API)     │  │ (rate-limit/cache)│
        └──────────────────┘  └──────────────────┘  └──────────────────┘

   Sidecars on the same host: certbot (renew), backup (pg_dump nightly @ 02:00 UTC),
   page-view-retention (purge nightly @ 03:00 UTC), redis (local fallback).
```

The container image is **multi-stage** (`Dockerfile`):
`base → deps → builder → runner`. The runner is a `node:20-alpine` image
running the standalone Next output as a non-root user — that's what gets
shipped.

---

## 2. One-time setup (do these once per environment)

### 2.1 Provision external services

**A. Supabase project** (https://supabase.com)

- Note the project ref, anon key, service-role key.
- Get the **pooler** connection string (port `6543`) → `DATABASE_URL`. This is
  non-negotiable: `app` runs at 4–10 replicas and direct 5432 connections will
  exhaust the pool.
- Get the **direct** connection string (port `5432`) → `DATABASE_DIRECT_URL`.
  Used only for migrations and `pg_dump`.
- Download the project's CA certificate → `DATABASE_CA_CERT`. Required when
  `NODE_ENV=production`.
- Create two storage buckets: `arl-public-media` (public) and
  `arl-protected-docs` (private). Mint S3-compatible access key + secret in
  the Storage settings.

**B. Upstash Redis** (https://console.upstash.com)

- Create a database, copy `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN`. Without these, each replica falls back to
  in-memory rate limiting (so users get N× the rate budget).

**C. Sentry** (https://sentry.io)

- Create a Next.js project, copy DSN → `SENTRY_DSN` and
  `NEXT_PUBLIC_SENTRY_DSN`. Mint an auth token for source-map uploads →
  `SENTRY_AUTH_TOKEN`.

**D. AirLabs** (flights provider)

- Get an API key → `FLIGHT_PROVIDER_API_KEY`. Optionally an api id for signed
  auth.

### 2.2 Provision the production VPS

You need a Linux host (Ubuntu 22.04+ recommended) with:

- Docker Engine + Docker Compose v2
- Git
- pnpm + Node 20 (only for the migration step in the deploy script — optional
  if you migrate elsewhere)
- Open ports `80` and `443` to the internet
- A user (e.g. `deploy`) in the `docker` group, with an authorized SSH key

**Sizing:** each `app` replica is capped at 512 MB. With 4 replicas + Nginx +
Redis + sidecars, plan for **4 GB RAM minimum** for staging, **8–16 GB** for
production at 10 replicas.

### 2.3 DNS and the domain

Point your domain's `A` record at the VPS public IP. Wait for DNS propagation
**before** issuing the cert.

### 2.4 Clone the repo on the VPS and write `.env`

```bash
ssh deploy@your-server
sudo mkdir -p /opt/arl-airport-platform
sudo chown deploy:deploy /opt/arl-airport-platform
cd /opt/arl-airport-platform
git clone https://github.com/<your-org>/arl-airport-platform.git .
cp .env.example .env
nano .env   # fill every CHANGE_ME
chmod 600 .env
```

Critical values in `.env`:

```bash
DOMAIN=airport.example.com               # used by Nginx template + Let's Encrypt
CERTBOT_EMAIL=admin@example.com          # for renewal notices
NEXT_PUBLIC_SITE_URL=https://airport.example.com

# Generate fresh secrets — don't reuse the placeholders
PAYLOAD_SECRET=$(openssl rand -base64 48)
REVALIDATE_SECRET=$(openssl rand -hex 32)
VISITOR_HASH_SALT=$(openssl rand -base64 32)
STATUS_SECRET=$(openssl rand -base64 24)

# Supabase, Upstash, Sentry, AirLabs values from §2.1
DATABASE_URL=postgresql://postgres.xxx:[pw]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_DIRECT_URL=postgresql://postgres.xxx:[pw]@aws-1-eu-west-1.supabase.com:5432/postgres
DATABASE_CA_CERT=<paste PEM contents>

APP_IMAGE=ghcr.io/<your-org>/arl-airport-platform:latest
```

`NEVER` commit this file. The `chmod 600` keeps it readable only to `deploy`.

### 2.5 Issue the TLS certificate (Let's Encrypt)

The compose file mounts `./certbot/conf` as `/etc/letsencrypt` for the Nginx
and Certbot containers. The bootstrap script in
`scripts/init-letsencrypt.sh` creates a temporary self-signed cert, starts
Nginx so the ACME HTTP-01 challenge can hit `/.well-known/acme-challenge/`,
then swaps in the real cert:

```bash
DOMAIN=airport.example.com EMAIL=admin@example.com ./scripts/init-letsencrypt.sh
```

Once that succeeds, the `certbot` sidecar re-runs `certbot renew` every 12 h,
and Nginx reloads itself every 6 h to pick up renewed certs.

If you skip this step (no `DOMAIN` set), the compose command falls back to
`nginx/nginx.conf` with the self-signed cert in `nginx/ssl/` — useful for
local staging only.

### 2.6 Run the first migration

Migrations need the **direct** connection (PgBouncer in transaction mode
breaks DDL):

```bash
cd /opt/arl-airport-platform
DATABASE_URL="$DATABASE_DIRECT_URL" pnpm install --frozen-lockfile
DATABASE_URL="$DATABASE_DIRECT_URL" pnpm migrate
```

### 2.7 First boot

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

You should see four `app` replicas reach `healthy` (~60s start_period), then
Nginx reach `healthy`. Hit `https://airport.example.com/api/health` from your
laptop — expect `200 OK`.

---

## 3. The day-to-day deploy (automated path)

Once §2 is done, this is all that's needed for new deploys. Three workflows
chain together:

**1. `.github/workflows/ci.yml`** — on every push to `main` and every PR

- `format-check`, `lint`, `typecheck`, `test` run in parallel.
- `build-and-e2e` runs after they pass: `pnpm build` then Playwright E2E.

**2. `.github/workflows/docker.yml`** — runs only when CI succeeds on `main`

- Logs in to ghcr.io with `GITHUB_TOKEN`.
- Builds the image and pushes two tags: `:latest` and `:<commit-sha>`.

**3. `.github/workflows/deploy.yml`** — runs only when Docker workflow
succeeds on `main`

SSHes to the VPS using these GitHub Actions secrets (Repo → Settings →
Secrets → Actions):

- `DEPLOY_HOST` — server IP/hostname
- `DEPLOY_USER` — `deploy`
- `DEPLOY_SSH_KEY` — private half of the key whose public half is in
  `~deploy/.ssh/authorized_keys`
- `DEPLOY_PATH` — `/opt/arl-airport-platform`
- `DEPLOY_WEBHOOK_URL` — optional Discord/Slack webhook

On the VPS, the script does:

1. `git pull origin main`
2. Snapshot current state for rollback
3. Run `pnpm migrate` against `DATABASE_DIRECT_URL`
4. `docker compose pull` to fetch the new `:latest` image
5. `docker compose up -d --remove-orphans` — rolling restart
6. `docker image prune -f`
7. Poll `https://localhost/api/health` 30× at 2 s intervals
8. **If unhealthy:** check out the previous commit's `docker-compose.prod.yml`
   and `Dockerfile`, recreate, re-poll. If that also fails, log "manual
   intervention required" and Discord-pings via `DEPLOY_WEBHOOK_URL`.

So the steady-state day-to-day flow is: **`git push origin main`**. Watch the
run in GitHub Actions; if green, your domain is serving the new build five
minutes later.

---

## 4. Manual deploy (when CI is broken or for the first deploy)

```bash
ssh deploy@your-server
cd /opt/arl-airport-platform

git pull origin main

# Build the image locally instead of pulling from ghcr.io
docker compose -f docker-compose.prod.yml build

# Apply any new migrations against the DIRECT URL
DATABASE_URL="$DATABASE_DIRECT_URL" pnpm migrate

# Recreate containers in place
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Verify
curl -ksf https://localhost/api/health
docker compose -f docker-compose.prod.yml ps
```

---

## 5. Scaling

`docker-compose.prod.yml` ships with `replicas: 4` — appropriate for staging.
For production at the planned ~40K concurrent users, edit to `replicas: 10`
(or more). Then:

```bash
docker compose -f docker-compose.prod.yml up -d --scale app=10
```

Nginx's `upstream app { server app:3000; keepalive 64; }` uses Docker's
embedded DNS to round-robin across all replicas automatically. No Nginx
config change needed when you scale.

The hard ceiling is the Supabase pooler — calculate
`replicas × per-replica-pool-size ≤ pooler-max-connections` and tune in
`src/lib/payload.ts`.

---

## 6. Verifying a deploy

After every deploy, sanity-check:

```bash
# 1. Health endpoint (Nginx + at least one app replica responding)
curl -k https://airport.example.com/api/health

# 2. Status endpoint (auth-gated, deeper checks of DB/Redis/Storage)
curl -k -H "Authorization: Bearer $STATUS_SECRET" https://airport.example.com/api/status

# 3. Service worker is served with no-cache
curl -kI https://airport.example.com/sw.js | grep -i cache-control
# expect: cache-control: public, max-age=0, must-revalidate

# 4. PWA manifest is accessible
curl -kI https://airport.example.com/manifest.webmanifest

# 5. Container health
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 app
```

For UI verification, open the site in a real browser: confirm "Install app"
prompt, offline mode, push notifications if applicable.

---

## 7. Operations (sidecars you got for free)

- **Backups** — `pg_dump` against `DATABASE_DIRECT_URL` daily at 02:00 UTC,
  gzipped to `./backups/`, pruned to `BACKUP_RETENTION_DAYS=30`. Restore from
  a `.sql.gz` with
  `gunzip -c backups/foo.sql.gz | psql "$DATABASE_DIRECT_URL"`.
- **Page-view retention** — purges `page_views` older than
  `PAGE_VIEW_RETENTION_DAYS=90` daily at 03:00 UTC.
- **Cert renewal** — `certbot` sidecar; Nginx reloads every 6 h.
- **Logs** — `docker compose logs -f <service>`. Sentry catches application
  errors in production.

---

## 8. Common gotchas

- **Migrations against the pooler URL fail silently or hang.** Always use
  `DATABASE_DIRECT_URL` for `pnpm migrate`. The deploy script already does
  this.
- **"DATABASE_CA_CERT required" on boot.** In `NODE_ENV=production` outside
  the build step, this is mandatory.
- **In-memory rate limit drift across replicas.** Means
  `UPSTASH_REDIS_REST_URL` is missing — fix the `.env`.
- **Health check failing during start.** `start_period: 60s` for `app` —
  anything longer is a real problem (often a bad `DATABASE_URL`).
- **`NEXT_PUBLIC_*` changes don't take effect.** They're baked into JS at
  build time. You must rebuild the image, not just restart.
- **Docker prunes the wrong stuff.** `docker image prune -f` is fine; never
  run `docker system prune -a` while the stack is up.

---

## 9. Quick-reference checklist

**First-time deploy:**

- [ ] Provision Supabase, Upstash, Sentry, AirLabs
- [ ] Provision VPS, install Docker + git + pnpm, create `deploy` user
- [ ] Point DNS at VPS
- [ ] Clone repo to `/opt/arl-airport-platform`, write `.env`
- [ ] Run `scripts/init-letsencrypt.sh` for TLS
- [ ] Run `pnpm migrate` against direct URL
- [ ] `docker compose -f docker-compose.prod.yml up --build -d`
- [ ] Configure GitHub Actions secrets (`DEPLOY_HOST`, `DEPLOY_USER`,
      `DEPLOY_SSH_KEY`, `DEPLOY_PATH`, `DEPLOY_WEBHOOK_URL`)
- [ ] Push to `main`, watch CI → Docker → Deploy succeed end-to-end

**Recurring deploy:**

- [ ] `git push origin main`
- [ ] Watch GitHub Actions
- [ ] `curl https://your-domain/api/health` returns 200

---

## 10. Production readiness updates

Automated deploys now pin `APP_IMAGE` in `deploy.env` to the image tag built
from the triggering commit SHA. Rollback restores the previous `APP_IMAGE`
value instead of checking out old Docker files, so a failed deploy returns to
the previous container image.

Migrations run from the newly pulled app image before traffic is swapped:

```bash
docker compose --env-file deploy.env -f docker-compose.prod.yml run --rm \
  -e DATABASE_URL="$DATABASE_DIRECT_URL" app pnpm migrate
```

The production app image intentionally includes the minimal migration runtime
needed by Payload. The VPS does not need Node or pnpm for deploys.

Rollout scales app replicas up, waits for `https://localhost/api/ready`, reloads
Nginx, then scales back down. `/api/health` remains liveness for container
healthchecks; `/api/ready` is the unauthenticated rollout readiness signal with
DB and Redis checks.

Nginx applies edge request and connection limits to `/api/*` except
`/api/health` and `/api/ready`. Static `/_next/static/*` responses are cached
at Nginx for one year, so repeat immutable asset requests should not appear in
app replica logs. Generated routes such as `manifest.webmanifest`, `robots.txt`,
and `sitemap.xml` remain proxied to Next.js.

Backups are still written locally under `./backups`, then mirrored to Supabase
Storage through S3-compatible credentials:

```bash
BACKUP_S3_ENDPOINT=https://YOUR_PROJECT_REF.storage.supabase.co/storage/v1/s3
BACKUP_S3_BUCKET=arl-db-backups
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Use a dedicated backup key with write-object permission for dated dump objects
and `latest.dump.gz`; do not grant list or delete. The weekly
`backup-restore-test` service reads `latest.dump.gz`, restores it to
`arl_restore_test` or `RESTORE_TEST_DATABASE_URL`, runs smoke counts, and alerts
on failure. If you split upload and restore credentials, the restore key only
needs read access to `latest.dump.gz`.

Application logs use Docker `json-file` rotation (`50m`, five files). External
aggregation with Vector, Promtail, or a managed collector remains a follow-up
once the destination endpoint and credentials are chosen.
