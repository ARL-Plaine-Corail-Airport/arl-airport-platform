# Production Readiness Audit — Fix Prompt (2026-04-27)

You are working on **ARL Airport Platform**, a Next.js 15 App Router + Payload CMS 3 PWA for
Plaine Corail Airport (Rodrigues Island, Mauritius). A production-readiness audit identified
the issues below. Implement the fixes in the order listed (P0 → P1 → P2). Stop and ask before
proceeding if any premise turns out to be wrong.

## Stack reminder
- Next.js 15.4 (App Router, standalone output), Payload 3.79, React 19, TypeScript
- Supabase Postgres (PgBouncer pooled + direct), Supabase Storage (S3-compatible)
- Upstash Redis (rate limiting + cache, in-memory fallback in dev)
- Docker multi-stage build, Nginx reverse proxy with horizontal scaling
- Sentry error monitoring; Vitest + Playwright tests
- pnpm 9, 3 locales (en, fr, mfe)

## Workflow
After each task:
1. `pnpm exec tsc --noEmit`
2. `pnpm test` (or just the affected suite if obvious)
3. If the change touches Docker/Compose/Nginx, do a local `docker compose -f docker-compose.prod.yml config` syntax check.

Match existing style: no semicolons, single quotes, 2-space indent.
**Do NOT** alter unrelated files, add comments that just describe what code does, or introduce
backwards-compat shims. Trust internal callers; validate only at system boundaries.

---

# P0 — Must fix before declaring GA

## Task 1: Pin deploy by image SHA so rollback actually rolls back

**Problem.** `.github/workflows/docker.yml` always overwrites `ghcr.io/.../:latest`. The deploy
workflow's "rollback" only reverts `docker-compose.prod.yml` and `Dockerfile` from a previous
git commit, then re-runs `docker compose up` — which pulls the same `:latest` and reproduces
the broken state. Image identity must be pinned per deploy and reverted on rollback.

**1a. `.github/workflows/docker.yml`**
Already tags `:latest` and `:${{ github.sha }}`. Add a job output that exposes the SHA tag
so downstream workflows can consume it:

```yaml
jobs:
  docker:
    # ...existing...
    outputs:
      image_tag: ${{ steps.meta.outputs.tag }}
    steps:
      # ...existing checkout + login...
      - id: meta
        run: echo "tag=${{ github.event.workflow_run.head_sha }}" >> "$GITHUB_OUTPUT"
      - name: Build and push image
        # ...existing build-push-action...
```

**1b. `.github/workflows/deploy.yml`**
- Pass the SHA tag through to the deploy job via `needs` / `workflow_run` context.
- On the SSH host, write `APP_IMAGE=ghcr.io/${{ github.repository }}:${SHA}` to a small
  `deploy.env` file *before* `docker compose up`, and `--env-file deploy.env` it into compose.
- Snapshot the **previous** `APP_IMAGE` value to `/tmp/arl-prev-image.txt` before the swap.
- On health-check failure, write that previous value back to `deploy.env` and re-run
  `docker compose up -d`. Drop the `git checkout` rollback — it's the wrong primitive.

**1c. `docker-compose.prod.yml`**
Confirm `app.image: ${APP_IMAGE}` (no `:latest` default). Fail loudly if `APP_IMAGE` is unset.

## Task 2: Run migrations inside the new image, atomically, before traffic swap

**Problem.** `deploy.yml:46-51` runs `pnpm migrate || echo "Warning..."` on the deploy host,
*before* the new image is pulled, and silently continues on failure. New replicas can boot
against a forward-incompatible schema; or worse, no migration runs at all if `pnpm` isn't on
the host.

**2a. Replace the host-side migration block in `.github/workflows/deploy.yml`** with:

```bash
echo "==> Pulling latest Docker image..."
docker compose --env-file deploy.env -f docker-compose.prod.yml pull app

echo "==> Running database migrations from new image..."
docker compose --env-file deploy.env -f docker-compose.prod.yml run --rm \
  -e DATABASE_URL="${DATABASE_DIRECT_URL}" \
  app pnpm migrate
# ↑ no `|| echo` — if migrate exits non-zero the workflow stops here.
```

**2b.** Remove the `command -v pnpm` check entirely. The host no longer needs Node.

**2c.** After migration succeeds, *then* `docker compose up -d` swaps the replicas.

## Task 3: Drain replicas one at a time during deploy

**Problem.** `docker compose up -d --remove-orphans` recreates all `app` replicas roughly in
parallel. With 4–10 replicas behind Nginx, every in-flight request to a replica being
recreated returns 502. The Nginx upstream also lacks passive health checks.

**3a. `nginx/nginx.conf` and `nginx/conf.d/default.conf.template`**
On the `upstream app` block, add:

```nginx
upstream app {
    server app:3000 max_fails=2 fail_timeout=10s;
    keepalive 64;
}
```

**3b. `.github/workflows/deploy.yml`** — replace the single `docker compose up -d` with a
scale-up-then-scale-down rollout (drop-in for Compose without the `docker rollout` plugin):

```bash
target=$(docker compose -f docker-compose.prod.yml config --format json \
  | jq '.services.app.deploy.replicas // 4')
docker compose --env-file deploy.env -f docker-compose.prod.yml up -d \
  --scale app=$((target * 2)) --no-recreate-deps app nginx certbot backup page-view-retention redis
sleep 30                              # let new replicas warm + pass healthcheck
docker compose --env-file deploy.env -f docker-compose.prod.yml up -d \
  --scale app=$target --remove-orphans
```

If you'd rather use `docker rollout` (https://github.com/Wowu/docker-rollout), document the
install step in `scripts/init-server.sh` (create if it doesn't exist) and call
`docker rollout app` instead. Either is acceptable; pick one and commit.

## Task 4: Mirror backups off-host

**Problem.** `scripts/backup-cron.sh` writes to `./backups` on the deploy host. If the VM is
lost, every backup is lost with it. There is no DR.

**4a. Add `scripts/backup-upload.sh`** that uploads the most recent `.dump.gz` to a Supabase
Storage bucket (re-use `arl-protected-docs` or create `arl-db-backups`). Use `aws s3 cp` via
the `awscli` package (already practical via `apk add --no-cache aws-cli` in the existing
`backup` postgres:16-alpine container, or use a dedicated `amazon/aws-cli` sidecar).

```sh
#!/bin/sh
set -eu
LATEST="$(ls -t "$BACKUP_DIR"/*.dump.gz 2>/dev/null | head -1)"
[ -n "$LATEST" ] || { echo "No backup to upload"; exit 0; }
aws --endpoint-url "$BACKUP_S3_ENDPOINT" s3 cp "$LATEST" "s3://$BACKUP_S3_BUCKET/"
echo "Uploaded $LATEST"
```

**4b. `scripts/backup-cron.sh`** — append `sh "$SCRIPT_DIR/backup-upload.sh"` after the
local compression+retention step. If upload fails, call `alert.sh` and exit non-zero.

**4c. `docker-compose.prod.yml`** — add `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` env vars to the `backup` service from `.env`.

**4d. `.env.example`** — document the four new vars and recommend a least-privilege bucket
policy (write-only, no list/delete) for the upload key.

## Task 5: Stop leaking the DB password via `pg_dump` argv

**Problem.** `scripts/backup-db.sh:15` passes `"$DATABASE_DIRECT_URL"` as an argv to `pg_dump`.
Any user on the host can read it via `/proc/<pid>/cmdline` while the dump runs.

**Fix.** Parse the URL in shell, export `PGPASSWORD`, pass `--host`/`--port`/`--username`/
`--dbname` flags. Example:

```sh
url="${DATABASE_DIRECT_URL}"
proto_stripped="${url#*://}"
userinfo="${proto_stripped%%@*}"
hostpath="${proto_stripped#*@}"
PGUSER="${userinfo%%:*}"
PGPASSWORD="${userinfo#*:}"
hostport="${hostpath%%/*}"
PGHOST="${hostport%%:*}"
PGPORT="${hostport#*:}"
PGDATABASE="${hostpath#*/}"
PGDATABASE="${PGDATABASE%%\?*}"
export PGPASSWORD PGUSER PGHOST PGPORT PGDATABASE
pg_dump --format=custom --file="$output_file"
```

(If you'd rather, use `python3 -c` to parse the URL — but the postgres:16-alpine image has
no Python. Stick with shell or `awk`.)

---

# P1 — Should fix this sprint

## Task 6: Sentry environment + release tags

**Problem.** All three Sentry init files set `environment: process.env.NEXT_PUBLIC_SITE_URL`.
That field is meant to be a short tag (`production`, `staging`) and is used for Sentry alert
routing. URLs are unusable here. The `release` field is also unset, so source-map upload and
regression detection don't work end-to-end.

**6a. `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`** —
replace each `environment:` line with:

```ts
environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
release: process.env.NEXT_PUBLIC_BUILD_VERSION || undefined,
```

**6b. `Dockerfile`** — add `ARG SENTRY_ENVIRONMENT` and `ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT`
in the builder stage.

**6c. `docker-compose.prod.yml`** — pass `SENTRY_ENVIRONMENT: ${SENTRY_ENVIRONMENT:-production}`
under both `app.build.args` and `app.environment`.

**6d. `.env.example`** — document `SENTRY_ENVIRONMENT` and recommend `production` / `staging`.

## Task 7: Don't initialize Sentry in CI

**Problem.** `.github/workflows/ci.yml` sets `SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0`
during the build. If any code path calls `Sentry.captureException` at build time, it tries to
ship to a public Sentry host.

**Fix.** In `ci.yml`, delete `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` from the env block.
Verify `sentry.*.config.ts` already gates init on a truthy DSN ✓ — no further code change needed.

## Task 8: Add edge rate limiting + connection caps in Nginx

**Problem.** Every spam request to `/api/*` costs a Node middleware invocation + Upstash
round-trip. Nginx is closer to the edge and should absorb the obvious abuse first.

**Fix in `nginx/nginx.conf` and `nginx/conf.d/default.conf.template`** (apply identically):

```nginx
http {
    # ...existing resolver, gzip, headers...

    limit_req_zone  $binary_remote_addr zone=api_burst:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=api_conn:10m;

    server {
        # ...existing 443 block...

        location /api/ {
            limit_req  zone=api_burst burst=20 nodelay;
            limit_conn api_conn 50;
            proxy_pass http://app;
            # ...existing proxy_set_header lines...
        }
    }
}
```

Skip the `limit_req` on `/api/health` (health probes need to be reliable):

```nginx
location = /api/health {
    proxy_pass http://app;
    # ...existing headers, no limit_req...
}
```

## Task 9: Serve static assets directly from Nginx

**Problem.** `_next/static/*`, manifest, icons all hit Node via `proxy_pass`. At 40K
concurrent users this is wasted file descriptors.

**Fix.**
**9a.** In the `runner` stage of `Dockerfile`, copy `public/` and `.next/static/` to a
shared named volume (or use `docker cp` in an init step). Simplest: bake a tarball into
the image at `/app/static-assets.tar.gz` and have an `init` container in compose extract it
into a `arl_static_assets` named volume on boot.

**9b. `docker-compose.prod.yml`** — add:

```yaml
volumes:
  arl_static_assets:
    name: arl_static_assets
```

Mount it on `app` (read-write, init only) and `nginx` (read-only).

**9c. `nginx/conf.d/default.conf.template` and `nginx/nginx.conf`**:

```nginx
location /_next/static/ {
    alias /var/www/arl-static/_next/static/;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}
location ~* ^/(favicon\.ico|manifest\.webmanifest|robots\.txt|sitemap\.xml|icon\.svg)$ {
    root /var/www/arl-static/public/;
    add_header Cache-Control "public, max-age=3600";
    try_files $uri =404;
}
```

If the named-volume init dance feels heavy, an acceptable alternative is to keep proxying
but turn on `proxy_cache` for `_next/static/*` (1y TTL). Pick one and commit.

## Task 10: Resource limits + log aggregation

**10a. `docker-compose.prod.yml`** — add CPU limits to the `app` service:

```yaml
deploy:
  replicas: 4
  resources:
    limits:
      memory: 512M
      cpus: '1.0'
    reservations:
      memory: 256M
      cpus: '0.5'
```

**10b.** Add a Vector or Promtail sidecar (Vector is simpler — single binary). Mount the
Docker socket read-only and ship to Loki (self-hosted) or Better Stack / Datadog (managed).
Document the choice in `docs/deployment.md`.

If neither is feasible right now, at minimum mount a host log directory:

```yaml
app:
  # ...existing...
  logging:
    driver: 'json-file'
    options:
      max-size: '50m'
      max-file: '5'
```

## Task 11: Split readiness from liveness

**Problem.** `/api/health` is liveness (returns 200 if Node responds). Compose healthcheck
uses it — correct. But Nginx upstream has no readiness signal, so a freshly-booted replica
gets traffic before its DB pool is warm.

**11a. Add `src/app/api/ready/route.ts`** — same shape as `/api/health` deep mode but **no
auth**. Quick DB ping + Redis ping. Cache `Cache-Control: no-store`.

**11b.** Use it in the rollout sleep window from Task 3 to wait for actual readiness instead
of a fixed 30s sleep:

```bash
for i in $(seq 1 60); do
  if curl -ksf --max-time 2 http://localhost/api/ready > /dev/null; then break; fi
  sleep 1
done
```

---

# P2 — Backlog

## Task 12: Dependency + image scanning in CI

**12a.** Enable Dependabot (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

**12b.** Add a `pnpm audit --audit-level=high` step to the existing `test` job in `ci.yml`
(don't gate on it initially — set `continue-on-error: true` until the noise level is known).

**12c.** Add a Trivy scan step to `.github/workflows/docker.yml` after the build step,
failing on HIGH/CRITICAL:

```yaml
- name: Scan image with Trivy
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: ghcr.io/${{ github.repository }}:${{ github.sha }}
    severity: 'HIGH,CRITICAL'
    exit-code: '1'
    ignore-unfixed: true
```

## Task 13: Backup restore drill

Add `scripts/backup-restore-test.sh` that:
1. Pulls the latest `.dump.gz` from S3.
2. `gunzip` and `pg_restore` into a scratch DB (`arl_restore_test`).
3. Runs a few smoke `SELECT count(*) FROM ...` queries on key tables.
4. Drops the scratch DB and exits non-zero on any failure.

Schedule it weekly via a new compose service (similar shape to `page-view-retention`).

## Task 14: Service-worker cache versioning

**Problem.** `public/sw.js:2-5` derives `CACHE_VERSION` from the SW URL's `?v=` query param,
defaulting to `'dev'`. If the registration site doesn't append the build version, every
client uses the same `dev` cache forever.

**Fix.** Locate the SW registration call (likely under `src/components/pwa/` or in the root
layout) and ensure it registers as `/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_VERSION}`.
Add a unit test asserting the registration URL contains `?v=`.

## Task 15: Dead-secret guardrail

Add a small check (could be a Vitest unit test under `tests/unit/env.test.ts`, which already
exists) that asserts every `CHANGE_ME_USE_*` placeholder from `.env.example` is **absent**
from the runtime `process.env` when `NODE_ENV === 'production'`. Helps catch the `.env`-not-
deployed case during smoke tests.

---

## Acceptance criteria

When all P0 tasks are merged:
- A failed deploy auto-rolls back to the previous image SHA without manual SSH.
- Migrations always run from the new image, with deploy aborting on migration failure.
- A canary replica drains before its replacement takes traffic.
- A nightly backup exists in off-host storage and is exercised weekly.
- `ps aux | grep pg_dump` on the deploy host shows no password.

When P1 tasks are merged:
- Sentry shows distinct `production` vs `staging` environments with each release tagged by
  commit SHA.
- A 1000-RPS spike to `/api/track` (e.g. `pnpm test:load:stress`) is bounced at Nginx, not Node.
- Static asset fetches don't appear in app-replica logs.

When P2 tasks are merged:
- Dependabot opens weekly PRs; Trivy fails the Docker workflow on a known-bad CVE.
- A scheduled restore job posts a green check or alerts on failure.

---

## Out of scope for this prompt

- Refactoring `src/lib/integrations/flights/index.ts` (large but working).
- Changing Payload schema or adding new collections.
- Modifying any of the existing 232 unit tests (only add tests for new behavior).
- Touching `PLANS.md` or `PRODUCTION_READINESS_PROMPT.md` (those are historical).
