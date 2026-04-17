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

# Build-time env: NEXT_PUBLIC_ values are baked into the JS bundle at build time.
# Secrets are injected at runtime via docker-compose — they only need placeholder
# values here so Next.js/Payload config evaluation doesn't throw during build.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_OUTPUT_MODE=standalone
ENV ARL_SKIP_DB_DURING_BUILD=1

# Placeholder values so payload.config.ts and env.ts don't throw during build.
# ARL_SKIP_DB_DURING_BUILD keeps Next/Payload from attempting live DB access
# while image artifacts are being compiled.
# These are NOT used at runtime — real values come from .env / docker-compose.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
ARG PAYLOAD_SECRET=build-time-placeholder-secret-min-32-chars
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ARG SUPABASE_S3_ACCESS_KEY_ID=placeholder
ARG SUPABASE_S3_SECRET_ACCESS_KEY=placeholder
ARG SUPABASE_S3_ENDPOINT=https://placeholder.supabase.co/storage/v1/s3
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV SUPABASE_S3_ACCESS_KEY_ID=$SUPABASE_S3_ACCESS_KEY_ID
ENV SUPABASE_S3_SECRET_ACCESS_KEY=$SUPABASE_S3_SECRET_ACCESS_KEY
ENV SUPABASE_S3_ENDPOINT=$SUPABASE_S3_ENDPOINT

# payload-types.ts is already committed — skip generate:types (needs DB connection).
# Just build Next.js in standalone mode.
RUN pnpm run build

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

# Healthcheck — lightweight liveness check (no DB dependency)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
