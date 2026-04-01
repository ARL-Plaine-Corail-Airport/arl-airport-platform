# =============================================================================
# ARL Airport Platform — Multi-stage Production Dockerfile
# Runtime: Next.js 15 + Payload CMS 3 (App Router, standalone output)
# Database: Supabase Postgres (external — not containerised)
# Storage:  Supabase Storage (external — not containerised)
# =============================================================================

# ── Stage 1: base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm@9 --quiet

# ── Stage 2: deps (install production + dev deps for build) ───────────────────
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile ensures reproducibility; CI will fail on drift
RUN pnpm install --frozen-lockfile

# ── Stage 3: builder ──────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env: only non-secret, NEXT_PUBLIC_ values are baked in.
# All secrets (DATABASE_URL, PAYLOAD_SECRET, Supabase keys) are
# injected at runtime via docker-compose or your orchestrator.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_OUTPUT_MODE=standalone

# Generate Payload types then build Next.js (standalone mode)
RUN pnpm run generate:types && pnpm run build

# ── Stage 4: runner (minimal production image) ────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 arl && \
    adduser  --system --uid 1001 arl

# Copy standalone build artefacts (requires output: 'standalone' in next.config)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=arl:arl /app/.next/standalone ./
COPY --from=builder --chown=arl:arl /app/.next/static     ./.next/static

USER arl

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Healthcheck — Payload admin endpoint confirms full stack readiness
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
