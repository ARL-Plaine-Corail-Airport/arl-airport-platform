import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

import { defaultLocale, isValidLocale, type Locale } from '@/i18n/config'
import { logger } from '@/lib/logger'
import {
  getLegacyVipRedirectPath,
  getMiddlewarePathInfo,
  matchesPathPrefix,
} from '@/lib/middleware-routing'

// ─── Rate Limiting (Redis-backed for multi-instance deployments) ────────────
// Uses Upstash sliding-window rate limiter shared across all instances.
// Falls back to in-memory limiter in development when Redis is not configured.

const RATE_LIMIT_MAX = 60 // requests per window
const RATE_LIMIT_WINDOW = '60 s'

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''

const ratelimit = upstashUrl && upstashToken
  ? new Ratelimit({
      redis: new Redis({ url: upstashUrl, token: upstashToken }),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW),
      prefix: 'arl:ratelimit',
    })
  : null

// In-memory fallback for local development (single-process only)
type RateBucket = { count: number; resetAt: number }
const devBuckets = new Map<string, RateBucket>()
let lastCleanup = Date.now()

function devRateLimit(ip: string): { limited: boolean; remaining: number } {
  const now = Date.now()
  if (now - lastCleanup > 300_000) {
    lastCleanup = now
    for (const [key, bucket] of devBuckets) {
      if (bucket.resetAt < now) devBuckets.delete(key)
    }
  }
  const bucket = devBuckets.get(ip)
  if (!bucket || bucket.resetAt < now) {
    devBuckets.set(ip, { count: 1, resetAt: now + 60_000 })
    return { limited: false, remaining: RATE_LIMIT_MAX - 1 }
  }
  bucket.count++
  const remaining = Math.max(0, RATE_LIMIT_MAX - bucket.count)
  return { limited: bucket.count > RATE_LIMIT_MAX, remaining }
}

// ─── Dashboard auth handoff ────────────────────────────────────────────────
// Dashboard section and role checks live in src/lib/dashboard.ts and
// src/lib/dashboard-auth.ts. Middleware only handles the unauthenticated
// redirect so access-control state stays server-side.
// ─── Content Security Policy ──────────────────────────────────────────────
// Generates a per-request CSP header with a nonce for script-src, replacing
// the blanket 'unsafe-inline' that was previously set in next.config.mjs.
// Only applied in production — dev skips CSP for HMR compatibility.
const IS_DEV = process.env.NODE_ENV === 'development'

type CspMode = 'app' | 'admin'

function buildAppCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com`,
    "font-src 'self'",
    `connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://airlabs.co`,
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

function buildAdminCspHeader(): string {
  return [
    "default-src 'self'",
    // Payload's admin app injects inline scripts and styles without nonce
    // support, so admin routes intentionally use a looser policy here only.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com`,
    "font-src 'self'",
    `connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://airlabs.co`,
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

function buildRequestHeaders(
  request: NextRequest,
  extraHeaders: Record<string, string>,
): Headers {
  const requestHeaders = new Headers(request.headers)

  for (const [key, value] of Object.entries(extraHeaders)) {
    requestHeaders.set(key, value)
  }

  return requestHeaders
}

function applyCspHeaders(
  response: NextResponse,
  mode: CspMode,
  nonce: string,
): NextResponse {
  if (IS_DEV) return response
  response.headers.set(
    'Content-Security-Policy',
    mode === 'admin' ? buildAdminCspHeader() : buildAppCspHeader(nonce),
  )

  if (mode === 'app') {
    response.headers.set('x-nonce', nonce)
  }

  return response
}

// ─── Locale routing helpers ────────────────────────────────────────────────
// Matches a leading locale segment: /en, /fr, /mfe followed by / or end-of-string
type AcceptedLocaleCandidate = {
  locale: Locale
  quality: number
  index: number
}

function getPreferredLocaleFromHeader(acceptLanguage: string): string | null {
  const candidates = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [rawTag, ...rawParams] = part.trim().split(';')
      const tag = rawTag?.trim().toLowerCase()

      if (!tag) return null

      const baseTag = tag.split('-')[0] ?? ''
      const locale = isValidLocale(tag)
        ? tag
        : isValidLocale(baseTag)
          ? baseTag
          : null

      if (!locale) return null

      let quality = 1
      for (const param of rawParams) {
        const [key, value] = param.split('=')
        if (key?.trim() !== 'q') continue

        const parsedQuality = Number.parseFloat(value ?? '')
        quality = Number.isFinite(parsedQuality) ? parsedQuality : 1
        break
      }

      if (quality <= 0) return null

      return { locale, quality, index }
    })
    .filter((candidate): candidate is AcceptedLocaleCandidate => candidate !== null)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  return candidates[0]?.locale ?? null
}

function getPreferredLocale(request: NextRequest): string {
  // 1. Cookie preference
  const cookieLocale = request.cookies.get('locale')?.value ?? ''
  if (isValidLocale(cookieLocale)) return cookieLocale

  // 2. Accept-Language header
  const acceptLang = request.headers.get('accept-language') ?? ''
  const headerLocale = getPreferredLocaleFromHeader(acceptLang)
  if (headerLocale) return headerLocale

  // 3. Default
  return defaultLocale
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { locale, normalizedPathname } = getMiddlewarePathInfo(pathname)
  const isLocalePrefixed = locale !== null

  if (normalizedPathname === '/monitoring' || normalizedPathname.startsWith('/monitoring/')) {
    return NextResponse.next()
  }

  // Generate a per-request nonce for CSP script-src
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const buildInternalUrl = (nextPathname: string) => {
    const url = new URL(nextPathname, request.url)
    url.search = request.nextUrl.search
    return url
  }

  const buildRouteResponse = (
    extraHeaders: Record<string, string> = {},
  ): NextResponse => {
    const requestHeaders = Object.keys(extraHeaders).length > 0
      ? buildRequestHeaders(request, extraHeaders)
      : undefined

    if (isLocalePrefixed) {
      return NextResponse.rewrite(buildInternalUrl(normalizedPathname), {
        ...(requestHeaders
          ? {
              request: {
                headers: requestHeaders,
              },
            }
          : {}),
      })
    }

    if (requestHeaders) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    return NextResponse.next()
  }

  const legacyRedirectPath = getLegacyVipRedirectPath(normalizedPathname, locale)
  if (legacyRedirectPath) {
    return NextResponse.redirect(buildInternalUrl(legacyRedirectPath), 308)
  }

  // ── Rate limit public API routes ──────────────────────────────────────
  // Only throttle the explicitly defined public API endpoints.
  // All other /api/* traffic is Payload's REST catch-all (admin/editor use)
  // and must not be rate-limited.
  const PUBLIC_API_ROUTES = ['/api/track', '/api/revalidate', '/api/health', '/api/flight-board', '/api/weather']
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(
    (route) => normalizedPathname === route || normalizedPathname.startsWith(`${route}/`),
  )
  if (isPublicApiRoute) {
    // Forwarded client IP headers are only trustworthy when a trusted reverse
    // proxy such as Vercel or Cloudflare sits in front of the app and strips
    // spoofed values. On direct/self-hosted deployments, treat these headers as
    // advisory rather than authoritative.
    const IP_PATTERN =
      /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^[a-f0-9:]{3,39}$/i
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')?.trim()
    const ip = rawIp && IP_PATTERN.test(rawIp) ? rawIp : 'anonymous'

    let limited = false
    let remaining: number | null = null

    if (ratelimit) {
      try {
        const result = await ratelimit.limit(ip)
        limited = !result.success
        remaining = result.remaining
      } catch (error) {
        logger.error('Rate limit check failed', error, 'middleware')
        limited = false
        remaining = null
      }
    } else {
      const result = devRateLimit(ip)
      limited = result.limited
      remaining = result.remaining
    }

    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    const response = buildRouteResponse()
    if (remaining !== null) {
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX))
      response.headers.set('X-RateLimit-Remaining', String(remaining))
    }
    return response
  }

  // ── Dashboard auth handoff ────────────────────────────────────────────
  // Payload stores auth in a JWT cookie named `payload-token`. Middleware
  // only checks whether that cookie exists and redirects unauthenticated
  // requests to the admin login. Section and role access are enforced
  // server-side in the dashboard auth helpers after payload.auth().
  if (matchesPathPrefix(normalizedPathname, '/dashboard')) {
    const payloadToken = request.cookies.get('payload-token')?.value

    if (!payloadToken) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', normalizedPathname)
      const redirectResponse = applyCspHeaders(
        NextResponse.redirect(loginUrl),
        'app',
        nonce,
      )
      redirectResponse.headers.set('Cache-Control', 'private, no-store')
      return redirectResponse
    }

    const dashResponse = applyCspHeaders(
      buildRouteResponse({ 'x-nonce': nonce }),
      'app',
      nonce,
    )
    dashResponse.headers.set('Cache-Control', 'private, no-store')
    return dashResponse
  }

  // ── Locale-prefixed URL routing ───────────────────────────────────────
  // Public frontend routes use URL-segment-based locale: /en/arrivals, /fr/notices, etc.
  // Middleware rewrites the locale-prefixed URL to the unprefixed route and passes
  // the locale via a request header so server components can read it.
  if (matchesPathPrefix(normalizedPathname, '/admin')) {
    const adminResponse = applyCspHeaders(buildRouteResponse(), 'admin', nonce)
    adminResponse.headers.set('Cache-Control', 'private, no-store')
    return adminResponse
  }

  if (locale) {
    const response = NextResponse.rewrite(buildInternalUrl(normalizedPathname), {
      request: {
        headers: buildRequestHeaders(request, {
          'x-locale': locale,
          'x-nonce': nonce,
        }),
      },
    })
    response.headers.set('x-locale', locale)
    // CDN-friendly cache header — allows edge servers to cache public pages
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    // Also persist locale choice in cookie for future visits
    response.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    return applyCspHeaders(response, 'app', nonce)
  }

  // ── Redirect unprefixed public routes to locale-prefixed URL ──────────
  // Skip admin, API, and internal paths.
  if (
    !matchesPathPrefix(normalizedPathname, '/admin') &&
    !matchesPathPrefix(normalizedPathname, '/api')
  ) {
    const locale = getPreferredLocale(request)
    const redirectUrl = new URL(`/${locale}${normalizedPathname}`, request.url)
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    '/((?!monitoring|_next|icon\\.svg|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|.*\\..*).*)',
  ],
}
