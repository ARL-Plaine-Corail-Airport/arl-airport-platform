import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'

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
const MAX_REFERRER_LENGTH = 2048

export const maxDuration = 10

function normalizeTrackEventPayload(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body

  const normalized = { ...body } as Record<string, unknown>

  // Accept older beacons that omitted type or serialized empty referrers as null.
  if (normalized.type == null) normalized.type = 'pageview'
  if (normalized.referrer == null) delete normalized.referrer

  return normalized
}

function hasOverlongReferrer(body: unknown): boolean {
  return (
    !!body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    typeof (body as Record<string, unknown>).referrer === 'string' &&
    ((body as Record<string, unknown>).referrer as string).length > MAX_REFERRER_LENGTH
  )
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
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
  if (referrer.length > MAX_REFERRER_LENGTH) {
    logger.warn('Rejected overlong referrer while extracting domain', 'track')
    return 'direct'
  }

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    // If referrer is own site, treat as direct/internal
    if (host === siteHost || host === `www.${siteHost}`) return 'direct'
    return host
  } catch {
    logger.warn('Invalid referrer URL while extracting domain', 'track')
    return 'direct'
  }
}

// Create a daily anonymized hash from IP — not reversible
// IP-less requests use a weaker user-agent/language fingerprint for daily estimates.
async function hashDailyVisitor(value: string): Promise<string> {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const data = new TextEncoder().encode(`${serverEnv.visitorHashSalt}:${value}:${date}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashVisitor(ip: string): Promise<string> {
  return hashDailyVisitor(ip)
}

async function hashVisitorFingerprint(ua: string, acceptLang: string | null): Promise<string> {
  return hashDailyVisitor(`fingerprint:${ua}:${acceptLang ?? ''}`)
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
    const siteOrigin = new URL(siteUrl).origin

    if (origin) {
      return timingSafeStringEqual(new URL(origin).origin, siteOrigin)
    }

    const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase()
    if (fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none') {
      return true
    }

    const referer = request.headers.get('referer')
    if (referer) {
      return timingSafeStringEqual(new URL(referer).origin, siteOrigin)
    }

    return false
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request, serverEnv.siteUrl)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch((err) => {
      logger.warn(
        `Invalid JSON in track: ${err instanceof Error ? err.message : 'unknown'}`,
        'track',
      )
      return null
    })
    const normalizedBody = normalizeTrackEventPayload(body)

    if (hasOverlongReferrer(normalizedBody)) {
      logger.warn('Rejected tracking event with overlong referrer', 'track')
      return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
    }

    const result = trackEventSchema.safeParse(normalizedBody)

    if (!result.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
    }

    const { path, referrer } = result.data
    const locale = extractLocaleFromPath(path)

    if (isBlockedPath(path)) {
      return new Response(null, { status: 204 })
    }

    const ua = request.headers.get('user-agent') ?? ''
    const acceptLang = request.headers.get('accept-language')
    const siteHost = new URL(serverEnv.siteUrl).host

    const clientIp = getClientIp(request)
    const visitorHash = clientIp === 'unknown'
      ? await hashVisitorFingerprint(ua, acceptLang)
      : await hashVisitor(clientIp)

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
    return NextResponse.json({ ok: false, error: 'Track event failed' }, { status: 500 })
  }
}
