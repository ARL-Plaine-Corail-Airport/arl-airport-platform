import { NextRequest, NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

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
  const data = new TextEncoder().encode(`${ip}:${date}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const path = typeof body.path === 'string' ? body.path : null

    if (!path || path.startsWith('/admin') || path.startsWith('/dashboard') || path.startsWith('/api')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1'

    const ua = request.headers.get('user-agent') ?? ''
    const acceptLang = request.headers.get('accept-language')
    const referrer = typeof body.referrer === 'string' ? body.referrer : null
    const siteHost = request.nextUrl.hostname

    const [visitorHash] = await Promise.all([hashVisitor(ip)])

    const payload = await getPayloadClient()
    await payload.create({
      collection: 'page-views',
      data: {
        path,
        referrer: extractReferrerDomain(referrer, siteHost),
        device: detectDevice(ua),
        language: extractLanguage(acceptLang),
        visitorHash,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
