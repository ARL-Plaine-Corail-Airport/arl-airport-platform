import { NextRequest, NextResponse } from 'next/server'

import { isValidLocale, type Locale } from '@/i18n/config'
import { serverEnv } from '@/lib/env.server'
import { getMiddlewarePathInfo, matchesPathPrefix } from '@/lib/middleware-routing'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { trackEventSchema } from '@/lib/validation'

const BLOCKED_PATH_PREFIXES = ['/admin', '/dashboard', '/api'] as const
const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/i
const IPV6_PATTERN =
  /^(?:[a-f0-9]{1,4}:){7}[a-f0-9]{1,4}$|^(?:[a-f0-9]{1,4}:){1,7}:$|^:(?::[a-f0-9]{1,4}){1,7}$|^(?:[a-f0-9]{1,4}:){1,6}:[a-f0-9]{1,4}$|^(?:[a-f0-9]{1,4}:){1,5}(?::[a-f0-9]{1,4}){1,2}$|^(?:[a-f0-9]{1,4}:){1,4}(?::[a-f0-9]{1,4}){1,3}$|^(?:[a-f0-9]{1,4}:){1,3}(?::[a-f0-9]{1,4}){1,4}$|^(?:[a-f0-9]{1,4}:){1,2}(?::[a-f0-9]{1,4}){1,5}$|^[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){1,6}$|^::$/i

function normalizeTrackEventPayload(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body

  const normalized = { ...body } as Record<string, unknown>

  // Accept older beacons that omitted type or serialized empty referrers as null.
  if (normalized.type == null) normalized.type = 'pageview'
  if (normalized.referrer == null) delete normalized.referrer

  return normalized
}

// Simple device detection from User-Agent
function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  const lower = ua.toLowerCase()
  if (/tablet|ipad|playbook|silk/.test(lower)) return 'tablet'
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(lower)) return 'mobile'
  return 'desktop'
}

// Extract primary language from Accept-Language header
function extractLanguage(header: string | null): string {
  if (!header) return 'unknown'
  const tag = header.split(',')[0]?.split(';')[0]?.trim().split('-')[0]?.toLowerCase()
  return tag || 'unknown'
}

// Extract referrer domain
function extractReferrerDomain(referrer: string | null, siteHost: string): string {
  if (!referrer) return 'direct'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    // If referrer is own site, treat as direct/internal
    if (host === siteHost || host === `www.${siteHost}`) return 'direct'
    return host
  } catch {
    return 'direct'
  }
}

// Create a daily anonymized hash from IP — not reversible
async function hashVisitor(ip: string): Promise<string> {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const data = new TextEncoder().encode(`${serverEnv.visitorHashSalt}:${ip}:${date}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function isBlockedPath(path: string): boolean {
  const { normalizedPathname } = getMiddlewarePathInfo(path)
  return BLOCKED_PATH_PREFIXES.some((prefix) => matchesPathPrefix(normalizedPathname, prefix))
}

function extractLocaleFromPath(path: string): Locale | null {
  const firstSegment = path.split('/').filter(Boolean)[0] ?? ''
  return isValidLocale(firstSegment) ? firstSegment : null
}

function getClientIp(request: NextRequest): string {
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()

  for (const candidate of [forwardedIp, realIp]) {
    if (candidate && (IPV4_PATTERN.test(candidate) || IPV6_PATTERN.test(candidate))) {
      return candidate
    }
  }

  return 'unknown'
}

function isAllowedOrigin(request: NextRequest, siteUrl: string): boolean {
  const origin = request.headers.get('origin')

  try {
    const site = new URL(siteUrl)

    if (origin) {
      return new URL(origin).origin === site.origin
    }

    const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase()
    if (fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none') {
      return true
    }

    const referer = request.headers.get('referer')
    if (referer) {
      return new URL(referer).host === site.host
    }

    return false
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request, serverEnv.siteUrl)) {
      return new Response(null, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const result = trackEventSchema.safeParse(normalizeTrackEventPayload(body))

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { path, referrer } = result.data
    const locale = extractLocaleFromPath(path)

    if (isBlockedPath(path)) {
      return new Response(null, { status: 204 })
    }

    const ua = request.headers.get('user-agent') ?? ''
    const acceptLang = request.headers.get('accept-language')
    const siteHost = new URL(serverEnv.siteUrl).host

    const visitorHash = await hashVisitor(getClientIp(request))

    const payload = await getPayloadClient()
    await payload.create({
      collection: 'page-views',
      data: {
        path,
        referrer: extractReferrerDomain(referrer ?? null, siteHost),
        locale,
        device: detectDevice(ua),
        language: extractLanguage(acceptLang),
        visitorHash,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    logger.error('Failed to record page view', error, 'track')
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
