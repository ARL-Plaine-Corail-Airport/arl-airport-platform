# Production Readiness — Phase 3 Implementation Prompt

You are working on **ARL Airport Platform**, a Next.js 15 App Router + Payload CMS 3 PWA for
Plaine Corail Airport (Rodrigues Island, Mauritius).

## Stack
- Next.js 15.4 (App Router, standalone output), Payload CMS 3.79, React 19, TypeScript
- Supabase Postgres (PgBouncer pooled + direct connection), Supabase Storage (S3-compatible)
- Upstash Redis (rate limiting + API caching, in-memory fallback in dev)
- Docker multi-stage build, Nginx reverse proxy with load balancing
- Sentry error monitoring, Vitest + Playwright testing
- pnpm 9, 3 locales (en, fr, mfe)

## What's already done (do NOT re-implement)
- CI pipeline: `.github/workflows/ci.yml` (format, lint, typecheck, test, build+e2e)
- CD pipeline: `.github/workflows/deploy.yml` (SSH deploy, migrations, health gate)
- Docker image build + push: `.github/workflows/docker.yml` (GHCR)
- Let's Encrypt SSL: `nginx/conf.d/default.conf.template`, `scripts/init-letsencrypt.sh`, certbot service in docker-compose
- Sentry integration: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/global-error.tsx`
- Zod input validation: `src/lib/validation.ts` (revalidate, track, flight-board schemas)
- ESLint + Prettier: `.prettierrc`, `eslint.config.mjs`, `format:check` in CI
- Bundle analyzer: `@next/bundle-analyzer` in `next.config.mjs`
- Security headers: CSP with nonces, HSTS, X-Frame-Options, Permissions-Policy in `src/middleware.ts`
- JWT signature verification: HMAC-SHA256 via Web Crypto API in `src/middleware.ts`
- Health endpoint: `src/app/api/health/route.ts` (liveness + deep DB check)
- Status endpoint: `src/app/api/status/route.ts` (bearer-auth protected, DB/Redis/Storage checks)
- Health probe script: `scripts/health-probe.sh` (cron-compatible curl probe)
- Automated backups: `scripts/backup-cron.sh` + `backup` service in docker-compose (daily 02:00 UTC, gzip, 30d retention)
- Manual backup: `scripts/backup-db.sh` (pg_dump)
- `.env.example` with full documentation of all env vars
- Rate limiting: Upstash Redis + in-memory fallback in middleware
- Structured logger: `src/lib/logger.ts` with Sentry integration (`captureException` / `captureMessage`)
- Test coverage: 52 test files, 232 tests passing (storage, UI components, weather, API routes, middleware, collections, cache, etc.)
- `.gitignore` covers `certbot/`, `backups/`, `nginx/ssl/`, `.env`, `coverage/`

## Current readiness: ~88%. These 5 tasks push to ~95%.

Work through each task in order. Make minimal, targeted changes. Run `pnpm exec tsc --noEmit`
and `pnpm test` after each task to verify nothing breaks. Match the existing code style
(no semicolons, single quotes, 2-space indent).

---

## Task 1: Deploy Rollback on Health Failure

**Problem**: `.github/workflows/deploy.yml` runs `docker compose up`, then polls `/api/health` up
to 30 times. If the health check fails, the workflow exits with code 1 — but the broken containers
keep running in production. There is no automatic rollback to the last known-good state.

**1a. Update `.github/workflows/deploy.yml`**

Read the current file. The deploy step's SSH script currently ends with a health-check loop that
calls `exit 1` on failure. Replace the entire `script:` block with the version below. Keep all
other workflow fields (`on`, `if`, `environment`, `uses`, `host`, `username`, `key`) unchanged.

```bash
set -eu
cd "${{ secrets.DEPLOY_PATH }}"

echo "==> Pulling latest code..."
git pull origin main

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Snapshot current image digests for rollback
echo "==> Saving current state for rollback..."
docker compose -f docker-compose.prod.yml config --images > /tmp/arl-pre-deploy-images.txt 2>/dev/null || true
current_commit=$(git rev-parse HEAD~1 2>/dev/null || echo "")

if command -v pnpm > /dev/null 2>&1; then
  echo "==> Running database migrations..."
  DATABASE_URL="${DATABASE_DIRECT_URL:-${DATABASE_URL:-}}" pnpm migrate || echo "Warning: Migration step failed - check manually"
else
  echo "Warning: pnpm is not available on the deploy host - skipping migration step"
fi

echo "==> Pulling latest Docker image..."
docker compose -f docker-compose.prod.yml pull

echo "==> Rolling restart..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "==> Pruning old images..."
docker image prune -f

echo "==> Waiting for health check..."
attempts=0
healthy=false
until curl -ksf --max-time 5 https://localhost/api/health > /dev/null 2>&1; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 30 ]; then
    break
  fi
  sleep 2
done

if curl -ksf --max-time 5 https://localhost/api/health > /dev/null 2>&1; then
  healthy=true
fi

if [ "$healthy" = "true" ]; then
  echo "==> Deploy complete. Health check passed."
  exit 0
fi

echo "==> HEALTH CHECK FAILED after 30 attempts. Rolling back..."

if [ -n "$current_commit" ]; then
  echo "==> Reverting to commit $current_commit..."
  git checkout "$current_commit" -- docker-compose.prod.yml Dockerfile || true
fi

docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Wait for rollback to stabilize
rollback_ok=false
for i in $(seq 1 15); do
  if curl -ksf --max-time 5 https://localhost/api/health > /dev/null 2>&1; then
    rollback_ok=true
    break
  fi
  sleep 2
done

if [ "$rollback_ok" = "true" ]; then
  echo "==> Rollback succeeded. Previous version restored."
else
  echo "==> CRITICAL: Rollback also failed. Manual intervention required."
fi

exit 1
```

**1b. Add a Slack/Discord notification step (optional but recommended)**

After the deploy step, add a notification step that fires on failure. This uses a simple
webhook — no extra dependencies. Add this as a second step in the `deploy` job:

```yaml
- name: Notify deploy failure
  if: failure()
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    username: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_SSH_KEY }}
    script: |
      curl -sf -X POST "${{ secrets.DEPLOY_WEBHOOK_URL }}" \
        -H "Content-Type: application/json" \
        -d "{\"content\": \"ARL deploy failed and rolled back. Check GitHub Actions.\"}" \
        2>/dev/null || true
```

Add to the workflow comments at the top:
```yaml
#   DEPLOY_WEBHOOK_URL — (optional) Discord/Slack webhook for failure notifications
```

**1c. Update `.env.example`**

Add at the end:
```
# Deploy failure notifications — Discord or Slack incoming webhook URL.
# Optional. If not set, deploy failures are only visible in GitHub Actions.
DEPLOY_WEBHOOK_URL=
```

---

## Task 2: Alerting for Health Probe Failures

**Problem**: `scripts/health-probe.sh` logs to a file and exits with code 1 on failure, but
nobody is notified. In production, a health check failure at 3 AM goes unnoticed until morning.

**2a. Create `scripts/alert.sh`**

A reusable alerting script that sends notifications via webhook. This is called by the health
probe and the backup script on failure.

```bash
#!/usr/bin/env sh
# Sends an alert notification via webhook (Discord, Slack, or generic).
# Usage: ./scripts/alert.sh "Alert title" "Alert message body"
#
# Requires: ALERT_WEBHOOK_URL env var (Discord or Slack incoming webhook).
# If ALERT_WEBHOOK_URL is not set, the alert is only logged to stderr.
set -eu

TITLE="${1:-Alert}"
MESSAGE="${2:-No details provided}"
WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
HOSTNAME="${HOSTNAME:-$(hostname 2>/dev/null || echo 'unknown')}"

timestamp=$(date -Iseconds 2>/dev/null || date)

echo "[$timestamp] ALERT: $TITLE - $MESSAGE" >&2

if [ -z "$WEBHOOK_URL" ]; then
  echo "[$timestamp] ALERT_WEBHOOK_URL not set — alert logged only" >&2
  exit 0
fi

# Discord and Slack both accept a JSON body with "content" (Discord) or "text" (Slack).
# This payload is compatible with both via Discord's webhook format.
# For Slack, use the Slack-specific format if needed.
payload=$(cat <<ENDJSON
{
  "content": "**[$HOSTNAME] $TITLE**\n$MESSAGE\n_$timestamp_"
}
ENDJSON
)

curl -sf -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$payload" > /dev/null 2>&1 || {
  echo "[$timestamp] Failed to send webhook alert" >&2
}
```

**2b. Update `scripts/health-probe.sh`**

Read the current `scripts/health-probe.sh`. Replace it with:

```bash
#!/usr/bin/env sh
# Health probe for cron-based uptime monitoring.
# On failure, sends an alert via webhook (if ALERT_WEBHOOK_URL is set).
#
# Add to crontab:
# */5 * * * * /opt/arl-airport-platform/scripts/health-probe.sh >> /var/log/arl-health.log 2>&1
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HEALTH_URL="${HEALTH_URL:-https://localhost/api/health?deep=true}"
STATUS_URL="${STATUS_URL:-}"
STATUS_TOKEN="${STATUS_SECRET:-}"

response=$(curl -ksf --max-time 10 "$HEALTH_URL") || {
  echo "[$(date -Iseconds)] ALERT: Health check failed" >&2
  sh "$SCRIPT_DIR/alert.sh" "Health Check Failed" "GET $HEALTH_URL returned an error or timed out."
  exit 1
}

echo "[$(date -Iseconds)] OK: $response"

# Optional: also check /api/status for per-service health
if [ -n "$STATUS_URL" ] && [ -n "$STATUS_TOKEN" ]; then
  status_response=$(curl -ksf --max-time 10 \
    -H "Authorization: Bearer $STATUS_TOKEN" \
    "$STATUS_URL" 2>/dev/null) || true

  if [ -n "$status_response" ]; then
    # Check if any service is degraded or unhealthy
    status_value=$(echo "$status_response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$status_value" = "degraded" ] || [ "$status_value" = "unhealthy" ]; then
      echo "[$(date -Iseconds)] WARNING: Status endpoint reports $status_value" >&2
      sh "$SCRIPT_DIR/alert.sh" "Service $status_value" "$status_response"
    fi
  fi
fi
```

**2c. Update `scripts/backup-cron.sh`**

Read the current `scripts/backup-cron.sh`. Add a call to `alert.sh` on backup failure.
Find the line that says `log "BACKUP FAILED"` followed by `exit 1`. Insert an alert call
between them:

Change this block:
```bash
  log "BACKUP FAILED"
  exit 1
```

To:
```bash
  log "BACKUP FAILED"
  sh "$SCRIPT_DIR/alert.sh" "Database Backup Failed" "Daily backup at $(date -Iseconds) did not complete successfully."
  exit 1
```

The `SCRIPT_DIR` variable is already defined at the top of the file as:
```bash
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
```

**2d. Update `.env.example`**

Add:
```
# Alert webhook — Discord or Slack incoming webhook URL for health/backup failure alerts.
# Optional. If not set, alerts are only logged to stderr/files.
ALERT_WEBHOOK_URL=
```

**2e. Add `ALERT_WEBHOOK_URL` to the backup service in `docker-compose.prod.yml`**

Read `docker-compose.prod.yml`. In the `backup` service's `environment` block, add:
```yaml
ALERT_WEBHOOK_URL: ${ALERT_WEBHOOK_URL:-}
```

This is added alongside the existing `DATABASE_DIRECT_URL`, `BACKUP_RETENTION_DAYS`, and
`BACKUP_DIR` environment variables.

---

## Task 3: Remaining UI Component Tests

**Problem**: 20 of 22 UI components in `src/components/ui/` have zero test coverage.
The following 6 components are the most critical untested ones (used on every page load
or in user-facing flows). The other components (maps, flight board, weather preview, etc.)
already have indirect coverage or are thin wrappers around third-party code.

Read each source file FIRST before writing its test. Match the existing test patterns from
`tests/unit/ui/detail-cards.test.tsx` and `tests/unit/ui/page-hero.test.tsx` (import style,
describe/it structure, mock patterns). Do NOT modify any existing test files.

**3a. `tests/unit/ui/notice-card.test.tsx`**

Test `src/components/ui/notice-card.tsx` (51 lines). This is a client component that uses
`useI18n()`, `Link` from next/link, and `formatDateTime` from `@/lib/date`.

Mocks needed:
```typescript
vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    localePath: (path: string) => `/en${path}`,
    locale: 'en',
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/date', () => ({
  formatDateTime: (date: string) => `formatted:${date}`,
}))
```

Test cases:
- Renders the notice title in an `h3` element.
- Renders summary text when provided.
- Does not render summary paragraph when `summary` is null/undefined.
- Renders category pill when `category` is provided (text content should be the i18n key
  `notice_categories.<category>`).
- Renders urgent pill with class `pill--danger` when `urgent` is true.
- Renders pinned indicator when `pinned` is true.
- Links to `/en/notices/<slug>` using the slug prop.
- Renders formatted publish date when `publishedAt` is provided.
- Does not render date paragraph when `publishedAt` is null.

**3b. `tests/unit/ui/emergency-banner.test.tsx`**

Test `src/components/ui/emergency-banner.tsx` (55 lines). This is a server component that
uses `Link` from next/link. It renders an urgent alert banner.

Mocks needed:
```typescript
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
```

Test cases:
- Returns null (renders nothing) when both `title` and `summary` are undefined/empty.
- Renders the `title` text when provided.
- Renders `summary` text when `title` is not provided (fallback).
- Renders as a link pointing to the `href` prop.
- Has `role="status"` and `aria-live="polite"` for accessibility.
- Contains a warning SVG icon (check for an `svg` element inside the banner).

**3c. `tests/unit/ui/filter-chips.test.tsx`**

Test `src/components/ui/filter-chips.tsx` (41 lines). This is a client component that uses
`useI18n()`, `Link` from next/link, and `useSearchParams` from next/navigation.

Mocks needed:
```typescript
vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    localePath: (path: string) => `/en${path}`,
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}))

// Mock useSearchParams to return a controllable URLSearchParams
const mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))
```

Test cases:
- Renders an "All" chip (text `labels.all`) that links to the base path.
- Renders one chip per option with correct label text.
- The "All" chip has the `filter-chip--active` class when no param is selected.
- An option chip has the `filter-chip--active` class when its value matches the current
  search param (update `mockSearchParams` before rendering).
- All chips have `scroll={false}` (rendered as no scroll attribute — this is a Next.js
  Link prop, just verify the links exist).
- The container div has `role="group"` for accessibility.

**3d. `tests/unit/ui/section-list.test.tsx`**

Test `src/components/ui/section-list.tsx` (72 lines). This is a client component that uses
`useI18n()` and the `RichText` component.

Mocks needed:
```typescript
vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/components/ui/rich-text', () => ({
  RichText: ({ data }: { data: any }) => <div data-testid="rich-text">{typeof data === 'string' ? data : 'rich-text-content'}</div>,
}))
```

Test cases:
- Renders empty state message (`labels.no_sections`) when `sections` is `[]` or `null`.
- Renders correct number of `section` elements for given sections array.
- Renders `h2` headings with section heading text.
- Generates correct section IDs from headings (e.g., "Safety Rules" becomes `safety-rules-1`).
- Renders numbered index (01, 02, etc.) for each section.
- Shows quick-links navigation when more than one section is provided.
- Does NOT show quick-links navigation when only one section is provided.
- Renders bullet items when a section has a `bullets` array.
- Does not render bullet list when `bullets` is empty or undefined.

**3e. `tests/unit/ui/rich-text.test.tsx`**

Test `src/components/ui/rich-text.tsx` (43 lines). This component handles both Lexical
richText data (from Payload CMS) and legacy plain-string content.

Mocks needed:
```typescript
vi.mock('@payloadcms/richtext-lexical/react', () => ({
  RichText: ({ data, className }: { data: any; className?: string }) => (
    <div data-testid="payload-richtext" className={className}>lexical-content</div>
  ),
}))
```

Test cases:
- Returns null when `data` is null or undefined.
- Renders plain-string content as `<p>` tags, splitting on double newlines.
- Handles duplicate paragraphs without key collisions (render a string with two identical
  paragraphs — both should appear).
- Passes Lexical data objects to the PayloadRichText component (check for the
  `data-testid="payload-richtext"` element).
- Applies custom `className` alongside the base `rich-text` class.
- Renders with just `rich-text` class when no custom className is provided.

**3f. `tests/unit/ui/quick-actions.test.tsx`**

Test `src/components/ui/quick-actions.tsx` (82 lines). This is a client component that
renders a grid of 6 navigation cards linking to key airport pages.

Mocks needed:
```typescript
vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    localePath: (path: string) => `/en${path}`,
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}))
```

Test cases:
- Renders exactly 6 navigation links.
- Links point to the correct localized paths: `/en/arrivals`, `/en/departures`,
  `/en/notices`, `/en/transport-parking`, `/en/contact`, `/en/airport-map`.
- The first two cards (arrivals, departures) have the `quick-action-card--primary` class.
- The remaining 4 cards do NOT have the `quick-action-card--primary` class.
- Each card contains an SVG icon (check for `svg` elements).
- Each card renders a title element with the i18n key `quick_actions.<key>`.

---

## Task 4: Deploy Status Badge & Uptime Log

**Problem**: There is no visibility into deploy history or uptime trends. The team relies on
checking GitHub Actions manually to know whether the latest deploy succeeded.

**4a. Add status badges to `README.md`**

Read the current `README.md`. At the very top of the file (before the first heading or after
the project title), add status badges for CI, Deploy, and Docker workflows:

```markdown
![CI](https://github.com/arl-plaine-corail-airport/arl-airport-platform/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/arl-plaine-corail-airport/arl-airport-platform/actions/workflows/deploy.yml/badge.svg)
![Docker](https://github.com/arl-plaine-corail-airport/arl-airport-platform/actions/workflows/docker.yml/badge.svg)
```

If there is no `README.md`, create one with just a project title and the badges.

**4b. Add deploy timestamp logging**

In `.github/workflows/deploy.yml`, at the end of the deploy SSH script (after the
`"==> Deploy complete. Health check passed."` echo), add:

```bash
echo "$(date -Iseconds) deploy=success commit=$(git rev-parse --short HEAD)" >> deploy.log
```

And in the rollback branch (after `"==> Rollback succeeded."` or `"==> CRITICAL: Rollback also failed."`),
add:

```bash
echo "$(date -Iseconds) deploy=rollback commit=$(git rev-parse --short HEAD)" >> deploy.log
```

This creates a simple append-only deploy log on the server for auditing.

**4c. Add `deploy.log` to `.gitignore`**

Check `.gitignore` and add `deploy.log` if not already present.

---

## Task 5: Load Testing Configuration

**Problem**: The platform is configured for 4 app replicas (scaling to 10+ in production) behind
Nginx load balancing, but there has been no load testing to validate throughput, identify
bottlenecks, or establish baseline performance metrics.

**5a. Create `tests/load/baseline.yml`**

Create an Artillery load test configuration. Artillery is a Node.js-based load testing tool
that integrates well with the existing pnpm/Node toolchain.

```yaml
# Artillery load test — baseline performance validation
# Usage: npx artillery run tests/load/baseline.yml
# Requires: APP_URL environment variable (defaults to https://localhost)
#
# Phases:
#   1. Warm-up: 5 users/sec for 30s (150 total)
#   2. Ramp-up: 5→50 users/sec over 60s (~1650 total)
#   3. Sustained: 50 users/sec for 60s (3000 total)
#   Total: ~4800 virtual users over 2.5 minutes

config:
  target: "{{ $processEnvironment.APP_URL }}"
  defaults:
    headers:
      Accept-Language: "en"
  phases:
    - name: "Warm-up"
      duration: 30
      arrivalRate: 5
    - name: "Ramp-up"
      duration: 60
      arrivalRate: 5
      rampTo: 50
    - name: "Sustained load"
      duration: 60
      arrivalRate: 50
  ensure:
    thresholds:
      - http.response_time.p99: 2000
      - http.response_time.p95: 1000
    conditions:
      - expression: "http.codes.200 / (http.codes.200 + http.codes.500) > 0.99"
        strict: true

scenarios:
  - name: "Homepage flow"
    weight: 40
    flow:
      - get:
          url: "/en"
      - think: 1
      - get:
          url: "/en/arrivals"
      - think: 2
      - get:
          url: "/en/departures"

  - name: "Notice browsing"
    weight: 20
    flow:
      - get:
          url: "/en/notices"
      - think: 2
      - get:
          url: "/en/passenger-guide"

  - name: "Information pages"
    weight: 20
    flow:
      - get:
          url: "/en/contact"
      - think: 1
      - get:
          url: "/en/transport-parking"
      - think: 1
      - get:
          url: "/en/amenities"

  - name: "API health check"
    weight: 10
    flow:
      - get:
          url: "/api/health"

  - name: "Flight board API"
    weight: 10
    flow:
      - get:
          url: "/api/flight-board?type=arrivals"
      - think: 1
      - get:
          url: "/api/flight-board?type=departures"
```

**5b. Create `tests/load/stress.yml`**

A higher-intensity stress test for pre-production validation:

```yaml
# Artillery stress test — find breaking points
# Usage: npx artillery run tests/load/stress.yml
# WARNING: This generates significant load. Only run against staging or localhost.

config:
  target: "{{ $processEnvironment.APP_URL }}"
  defaults:
    headers:
      Accept-Language: "en"
  phases:
    - name: "Warm-up"
      duration: 30
      arrivalRate: 10
    - name: "Ramp to stress"
      duration: 120
      arrivalRate: 10
      rampTo: 200
    - name: "Peak sustained"
      duration: 60
      arrivalRate: 200
  ensure:
    thresholds:
      - http.response_time.p99: 5000
      - http.response_time.p95: 3000

scenarios:
  - name: "Mixed traffic"
    flow:
      - get:
          url: "/en"
      - think: 0.5
      - get:
          url: "/en/arrivals"
      - think: 0.5
      - get:
          url: "/api/flight-board?type=arrivals"
      - think: 1
      - get:
          url: "/en/notices"
```

**5c. Add npm scripts to `package.json`**

Add these to the `scripts` section in `package.json`:

```json
"test:load": "artillery run tests/load/baseline.yml",
"test:load:stress": "artillery run tests/load/stress.yml"
```

**5d. Add Artillery as a dev dependency**

```bash
pnpm add -D artillery
```

**5e. Create `tests/load/README.md`**

```markdown
# Load Testing

## Prerequisites

Set the `APP_URL` environment variable to the target:

```bash
# Local (Docker Compose)
export APP_URL=https://localhost

# Staging
export APP_URL=https://staging.airport.example.com
```

## Running

```bash
# Baseline test (~4800 users over 2.5 min)
pnpm test:load

# Stress test (~25000 users over 3.5 min)
pnpm test:load:stress
```

## Interpreting Results

Artillery prints a summary with:
- **http.response_time.p95/p99**: 95th and 99th percentile response times
- **http.codes.xxx**: count of each HTTP status code
- **vusers.completed**: virtual users that finished their scenario

### Thresholds (baseline)
- p99 < 2000ms
- p95 < 1000ms
- Error rate < 1%

If thresholds fail, Artillery exits with code 1.
```

---

## Verification Checklist

After implementing ALL 5 tasks, run these and confirm they pass:

```bash
pnpm exec tsc --noEmit       # TypeScript — zero errors
pnpm test                    # Vitest — all tests pass (existing + new)
pnpm lint                    # ESLint — no errors
```

Confirm these NEW files exist:
- `scripts/alert.sh` (executable)
- `tests/unit/ui/notice-card.test.tsx`
- `tests/unit/ui/emergency-banner.test.tsx`
- `tests/unit/ui/filter-chips.test.tsx`
- `tests/unit/ui/section-list.test.tsx`
- `tests/unit/ui/rich-text.test.tsx`
- `tests/unit/ui/quick-actions.test.tsx`
- `tests/load/baseline.yml`
- `tests/load/stress.yml`
- `tests/load/README.md`

Confirm these files were UPDATED:
- `.github/workflows/deploy.yml` (rollback logic, webhook notification, deploy logging)
- `scripts/health-probe.sh` (alert.sh integration, optional /api/status check)
- `scripts/backup-cron.sh` (alert.sh call on failure)
- `docker-compose.prod.yml` (ALERT_WEBHOOK_URL in backup service)
- `.env.example` (DEPLOY_WEBHOOK_URL, ALERT_WEBHOOK_URL)
- `.gitignore` (deploy.log)
- `package.json` (test:load and test:load:stress scripts, artillery devDep)
- `README.md` (status badges)

**Do NOT:**
- Change any existing business logic or Payload collections/globals
- Modify the service worker, i18n setup, or UI styling
- Delete or rename existing files
- Modify any existing test files
- Push to remote or create PRs
