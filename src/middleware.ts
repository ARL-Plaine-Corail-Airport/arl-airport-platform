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
import {
  getConfiguredFlightProviderBaseUrl,
  getConfiguredWeatherProviderBaseUrl,
} from '@/lib/provider-endpoints'
import { getRateLimitKey } from '@/lib/rate-limit'

// ─── Rate Limiting (Redis-backed for multi-instance deployments) ────────────
// Uses Upstash sliding-window rate limiter shared across all instances.
// Falls back to in-memory limiter in development when Redis is not configured.

const PUBLIC_API_RATE_LIMIT_MAX = 60 // requests per window
const PAYLOAD_API_RATE_LIMIT_MAX = 300 // admin/API traffic can legitimately burst
const RATE_LIMIT_WINDOW = '60 s'

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''

function createRatelimit(max: number, prefix: string): Ratelimit | null {
  return upstashUrl && upstashToken
    ? new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(max, RATE_LIMIT_WINDOW),
        prefix,
      })
    : null
}

const publicApiRatelimit = createRatelimit(
  PUBLIC_API_RATE_LIMIT_MAX,
  'arl:ratelimit:public-api',
)
const payloadApiRatelimit = createRatelimit(
  PAYLOAD_API_RATE_LIMIT_MAX,
  'arl:ratelimit:payload-api',
)

const PUBLIC_API_ROUTES = [
  '/api/track',
  '/api/revalidate',
  '/api/health',
  '/api/status',
  '/api/flight-board',
  '/api/weather',
] as const

// In-memory fallback for local development (single-process only)
type RateBucket = { count: number; resetAt: number }
const DEV_BUCKET_MAX_ENTRIES = 1000
const devBuckets = new Map<string, RateBucket>()

function evictOldestDevBucket() {
  const oldestKey = devBuckets.keys().next().value
  if (oldestKey !== undefined) {
    devBuckets.delete(oldestKey)
  }
}

function devRateLimit(key: string, max: number): { limited: boolean; remaining: number } {
  const now = Date.now()
  const bucket = devBuckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    while (devBuckets.size >= DEV_BUCKET_MAX_ENTRIES) {
      evictOldestDevBucket()
    }
    devBuckets.set(key, { count: 1, resetAt: now + 60_000 })
    return { limited: false, remaining: max - 1 }
  }
  bucket.count++
  const remaining = Math.max(0, max - bucket.count)
  return { limited: bucket.count > max, remaining }
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

const CSP_IMG_SRC =
  "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com https://www.gravatar.com https://secure.gravatar.com"

function getUrlOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function buildConnectSrc(): string {
  const providerOrigins = [
    getUrlOrigin(getConfiguredWeatherProviderBaseUrl()),
    getUrlOrigin(getConfiguredFlightProviderBaseUrl()),
  ].filter((origin): origin is string => Boolean(origin))

  return `connect-src ${Array.from(new Set([
    "'self'",
    'https://*.supabase.co',
    ...providerOrigins,
  ])).join(' ')}`
}

// Provider endpoint env vars are read at edge cold start. Change requires
// container restart; rolling deploys pick up new origins automatically.
const CSP_CONNECT_SRC = buildConnectSrc()

function buildAppCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    CSP_IMG_SRC,
    "font-src 'self'",
    CSP_CONNECT_SRC,
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
    CSP_IMG_SRC,
    "font-src 'self'",
    CSP_CONNECT_SRC,
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

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')

  return atob(padded)
}

function decodeBase64UrlBytes(value: string): Uint8Array<ArrayBuffer> {
  const decoded = decodeBase64Url(value)
  const bytes = new Uint8Array(decoded.length)

  for (let index = 0; index < decoded.length; index++) {
    bytes[index] = decoded.charCodeAt(index)
  }

  return bytes
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.')

  if (!payload) {
    return null
  }

  try {
    const decoded = decodeBase64Url(payload)
    const parsed = JSON.parse(decoded)

    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

const JWT_VERIFY_CACHE_TTL_MS = 30_000
const JWT_VERIFY_CACHE_MAX_ENTRIES = 256

type JwtVerifyCacheEntry = {
  secret: string
  expiresAt: number
}

const jwtVerifyCache = new Map<string, JwtVerifyCacheEntry>()
const jwtKeyEncoder = new TextEncoder()
let cachedJwtKeySecret: string | null = null
let cachedJwtKey: CryptoKey | null = null
let cachedJwtKeyPromise: Promise<CryptoKey> | null = null

function getCachedJwtVerification(token: string, secret: string): boolean | null {
  const entry = jwtVerifyCache.get(token)
  if (!entry) return null

  if (entry.secret !== secret || entry.expiresAt <= Date.now()) {
    jwtVerifyCache.delete(token)
    return null
  }

  jwtVerifyCache.delete(token)
  jwtVerifyCache.set(token, entry)
  return true
}

function setCachedJwtVerification(token: string, secret: string, valid: boolean): void {
  if (!valid) return
  const now = Date.now()

  for (const [cachedToken, entry] of jwtVerifyCache) {
    if (entry.expiresAt <= now) {
      jwtVerifyCache.delete(cachedToken)
    }
  }

  jwtVerifyCache.set(token, {
    secret,
    expiresAt: now + JWT_VERIFY_CACHE_TTL_MS,
  })

  while (jwtVerifyCache.size > JWT_VERIFY_CACHE_MAX_ENTRIES) {
    const oldestToken = jwtVerifyCache.keys().next().value
    if (!oldestToken) break
    jwtVerifyCache.delete(oldestToken)
  }
}

async function getJwtVerificationKey(secret: string): Promise<CryptoKey> {
  if (cachedJwtKey && cachedJwtKeySecret === secret) {
    return cachedJwtKey
  }

  if (cachedJwtKeyPromise && cachedJwtKeySecret === secret) {
    return cachedJwtKeyPromise
  }

  cachedJwtKeySecret = secret
  cachedJwtKey = null

  const keySecret = secret
  cachedJwtKeyPromise = crypto.subtle.importKey(
    'raw',
    jwtKeyEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  ).then((key) => {
    if (cachedJwtKeySecret === keySecret) {
      cachedJwtKey = key
    }
    return key
  }).finally(() => {
    if (cachedJwtKeySecret === keySecret) {
      cachedJwtKeyPromise = null
    }
  })

  return cachedJwtKeyPromise
}

async function isValidJwt(token: string): Promise<boolean> {
  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [headerB64, payloadB64, signatureB64] = parts
  if (!headerB64 || !payloadB64 || !signatureB64) return false

  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return false

  const cachedVerification = getCachedJwtVerification(token, secret)
  if (cachedVerification !== null) return cachedVerification

  try {
    const key = await getJwtVerificationKey(secret)
    const data = jwtKeyEncoder.encode(`${headerB64}.${payloadB64}`)
    const signature = decodeBase64UrlBytes(signatureB64)

    const valid = await crypto.subtle.verify('HMAC', key, signature, data)
    // Only cache successful verifications. Caching failures would let an
    // attacker spam invalid tokens to evict legitimate entries from the LRU.
    if (valid) setCachedJwtVerification(token, secret, true)
    return valid
  } catch {
    return false
  }
}

function isExpiredJwt(token: string): boolean {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp

  return typeof exp === 'number' && Number.isFinite(exp) && exp * 1000 <= Date.now()
}

async function checkRateLimit(
  request: NextRequest,
  normalizedPathname: string,
  options: {
    limiter: Ratelimit | null
    max: number
    scope: string
  },
): Promise<{ limited: boolean; remaining: number | null }> {
  const rateLimitKey = getRateLimitKey(request, normalizedPathname)

  if (options.limiter) {
    try {
      const result = await options.limiter.limit(rateLimitKey)
      return {
        limited: !result.success,
        remaining: result.remaining,
      }
    } catch (error) {
      logger.error('Rate limit check failed', error, 'middleware')
      return { limited: false, remaining: null }
    }
  }

  return devRateLimit(`${options.scope}:${rateLimitKey}`, options.max)
}

function rateLimitResponse(max: number): NextResponse {
  return NextResponse.json(
    { ok: false, error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': '0',
      },
    },
  )
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
  const { locale, normalizedPathname } = getMiddlewarePathInfo(
    pathname,
    request.headers.get('host') ?? request.nextUrl.host,
  )
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
    return NextResponse.redirect(buildInternalUrl(legacyRedirectPath), 307)
  }

  // ── Rate limit public API routes ──────────────────────────────────────
  // Only throttle the explicitly defined public API endpoints.
  // Remaining /api/* traffic is Payload's REST catch-all (admin/editor use)
  // and gets a higher per-IP limit below so admin traffic is not unbounded.
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(
    (route) => normalizedPathname === route || normalizedPathname.startsWith(`${route}/`),
  )
  if (isPublicApiRoute) {
    // Forwarded client IP headers are only trustworthy when a trusted reverse
    // proxy such as Vercel or Cloudflare sits in front of the app and strips
    // spoofed values. On direct/self-hosted deployments, treat these headers as
    // advisory rather than authoritative. When no trusted IP is available, use
    // a stable fingerprint so repeated anonymous requests from the same
    // client share a limiter bucket without relying on trusted IP headers.
    const { limited, remaining } = await checkRateLimit(request, normalizedPathname, {
      limiter: publicApiRatelimit,
      max: PUBLIC_API_RATE_LIMIT_MAX,
      scope: 'public-api',
    })

    if (limited) {
      return rateLimitResponse(PUBLIC_API_RATE_LIMIT_MAX)
    }

    const response = buildRouteResponse()
    if (remaining !== null) {
      response.headers.set('X-RateLimit-Limit', String(PUBLIC_API_RATE_LIMIT_MAX))
      response.headers.set('X-RateLimit-Remaining', String(remaining))
    }
    return response
  }

  // Rate limit Payload REST catch-all routes without blocking login/admin access.
  if (matchesPathPrefix(normalizedPathname, '/api')) {
    const { limited, remaining } = await checkRateLimit(request, normalizedPathname, {
      limiter: payloadApiRatelimit,
      max: PAYLOAD_API_RATE_LIMIT_MAX,
      scope: 'payload-api',
    })

    if (limited) {
      return rateLimitResponse(PAYLOAD_API_RATE_LIMIT_MAX)
    }

    const response = buildRouteResponse()
    if (remaining !== null) {
      response.headers.set('X-RateLimit-Limit', String(PAYLOAD_API_RATE_LIMIT_MAX))
      response.headers.set('X-RateLimit-Remaining', String(remaining))
    }
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  // Dashboard auth handoff
  // Payload stores auth in a JWT cookie named `payload-token`. Middleware
  // verifies the signature before using the expiry shortcut. Section and role
  // access are still enforced server-side in the dashboard auth helpers after
  // payload.auth().
  if (matchesPathPrefix(normalizedPathname, '/dashboard')) {
    const payloadToken = request.cookies.get('payload-token')?.value

    if (!payloadToken || !(await isValidJwt(payloadToken)) || isExpiredJwt(payloadToken)) {
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
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
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
    return NextResponse.redirect(redirectUrl, 307)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    '/((?!monitoring|_next|icon\\.svg|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|.*\\..*).*)',
  ],
}
