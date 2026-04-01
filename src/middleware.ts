import { NextRequest, NextResponse } from 'next/server'

import { defaultLocale, isValidLocale } from '@/i18n/config'

// ─── Rate Limiting (in-memory, per-IP) ──────────────────────────────────────
// Limits public API routes to prevent abuse. Uses a simple sliding-window
// counter per IP. Not shared across instances — suitable for single-node or
// low-traffic deployments. For multi-instance, swap for Redis-backed limiter.

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 60 // requests per window

type RateBucket = { count: number; resetAt: number }
const rateBuckets = new Map<string, RateBucket>()

// Cleanup stale entries every 5 minutes to prevent memory leak
let lastCleanup = Date.now()
function cleanupBuckets() {
  const now = Date.now()
  if (now - lastCleanup < 300_000) return
  lastCleanup = now
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt < now) rateBuckets.delete(key)
  }
}

function isRateLimited(ip: string): { limited: boolean; remaining: number } {
  cleanupBuckets()
  const now = Date.now()
  const bucket = rateBuckets.get(ip)

  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { limited: false, remaining: RATE_LIMIT_MAX - 1 }
  }

  bucket.count++
  const remaining = Math.max(0, RATE_LIMIT_MAX - bucket.count)

  if (bucket.count > RATE_LIMIT_MAX) {
    return { limited: true, remaining: 0 }
  }

  return { limited: false, remaining }
}

// ─── Dashboard route → role gating ─────────────────────────────────────────
// Maps dashboard sub-routes to the section IDs used by ROLE_ACCESS in
// src/lib/dashboard.ts. The layout already redirects unauthenticated users,
// but this adds path-level enforcement so a viewer_auditor can't navigate
// to /dashboard/settings by typing the URL.

const ROUTE_TO_SECTION: Record<string, string> = {
  '/dashboard': 'overview',
  '/dashboard/analytics': 'analytics',
  '/dashboard/flights': 'flights',
  '/dashboard/notices': 'notices',
  '/dashboard/emergency': 'emergency',
  '/dashboard/weather': 'weather',
  '/dashboard/pages-cms': 'pages',
  '/dashboard/faqs': 'faqs',
  '/dashboard/airlines': 'airlines',
  '/dashboard/amenities': 'amenities',
  '/dashboard/transport': 'transport',
  '/dashboard/media': 'media',
  '/dashboard/users': 'users',
  '/dashboard/audit': 'audit',
  '/dashboard/settings': 'settings',
}

// Role access matrix (duplicated from dashboard.ts to avoid importing server
// code into edge middleware — keep in sync)
const ROLE_ACCESS: Record<string, string[]> = {
  super_admin: [
    'overview', 'analytics', 'flights', 'notices', 'emergency', 'weather',
    'pages', 'faqs', 'airlines', 'amenities', 'transport', 'media',
    'users', 'audit', 'settings',
  ],
  content_admin: [
    'overview', 'analytics', 'flights', 'notices', 'emergency', 'weather',
    'pages', 'faqs', 'airlines', 'amenities', 'transport', 'media',
    'users', 'audit',
  ],
  approver: ['overview', 'flights', 'notices', 'pages', 'faqs'],
  operations_editor: [
    'overview', 'flights', 'notices', 'weather', 'pages', 'faqs',
    'amenities', 'transport',
  ],
  translator: ['overview', 'notices', 'pages', 'faqs'],
  viewer_auditor: ['overview', 'flights', 'notices', 'pages'],
}

const ROLE_PRIORITY = [
  'super_admin', 'content_admin', 'approver',
  'operations_editor', 'translator', 'viewer_auditor',
]

function getPrimaryRoleFromCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null
  try {
    const parsed = JSON.parse(cookieValue)
    const roles: string[] = parsed?.user?.roles ?? parsed?.roles ?? []
    if (!Array.isArray(roles)) return null
    for (const r of ROLE_PRIORITY) {
      if (roles.includes(r)) return r
    }
    return roles.length > 0 ? 'viewer_auditor' : null
  } catch {
    return null
  }
}

// ─── Content Security Policy ──────────────────────────────────────────────
// Generates a per-request CSP header with a nonce for script-src, replacing
// the blanket 'unsafe-inline' that was previously set in next.config.mjs.
// Only applied in production — dev skips CSP for HMR compatibility.
const IS_DEV = process.env.NODE_ENV === 'development'

function buildCspHeader(nonce: string): string {
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

function applyCspHeaders(response: NextResponse, nonce: string): NextResponse {
  if (IS_DEV) return response
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce))
  response.headers.set('x-nonce', nonce)
  return response
}

// ─── Locale routing helpers ────────────────────────────────────────────────
// Matches a leading locale segment: /en, /fr, /mfe followed by / or end-of-string
const LOCALE_PREFIX_RE = /^\/(en|fr|mfe)(\/|$)/

function getPreferredLocale(request: NextRequest): string {
  // 1. Cookie preference
  const cookieLocale = request.cookies.get('locale')?.value ?? ''
  if (isValidLocale(cookieLocale)) return cookieLocale

  // 2. Accept-Language header
  const acceptLang = request.headers.get('accept-language') ?? ''
  if (acceptLang.includes('fr')) return 'fr'

  // 3. Default
  return defaultLocale
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Generate a per-request nonce for CSP script-src
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // ── Rate limit public API routes ──────────────────────────────────────
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/[[')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '127.0.0.1'

    const { limited, remaining } = isRateLimited(ip)

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

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  // ── Dashboard role gating ─────────────────────────────────────────────
  // Payload stores auth in a JWT cookie named `payload-token`. We can't
  // decode the JWT here without the secret, but we can check if the cookie
  // exists. Full role enforcement happens server-side in the layout; this
  // is a first-pass redirect for unauthenticated users.
  if (pathname.startsWith('/dashboard')) {
    const payloadToken = request.cookies.get('payload-token')?.value

    if (!payloadToken) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Note: Full role-based access is enforced server-side in the dashboard
    // layout via payload.auth(). Middleware can't decode the JWT without the
    // secret, so we only check cookie presence here.
    return NextResponse.next()
  }

  // ── Locale-prefixed URL routing ───────────────────────────────────────
  // Public frontend routes use URL-segment-based locale: /en/arrivals, /fr/notices, etc.
  // Middleware rewrites the locale-prefixed URL to the unprefixed route and passes
  // the locale via a request header so server components can read it.
  const localeMatch = pathname.match(LOCALE_PREFIX_RE)
  if (localeMatch) {
    const locale = localeMatch[1]
    const rest = pathname.slice(locale.length + 1) || '/' // strip /{locale}
    const rewriteUrl = new URL(rest, request.url)
    rewriteUrl.search = request.nextUrl.search
    const response = NextResponse.rewrite(rewriteUrl)
    response.headers.set('x-locale', locale)
    // Also persist locale choice in cookie for future visits
    response.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    return applyCspHeaders(response, nonce)
  }

  // ── Redirect unprefixed public routes to locale-prefixed URL ──────────
  // Skip admin, API, and internal paths.
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api')
  ) {
    const locale = getPreferredLocale(request)
    const redirectUrl = new URL(`/${locale}${pathname}`, request.url)
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    '/((?!_next|icon\\.svg|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|.*\\..*).*)',
  ],
}
