import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

const MIN_STATUS_SECRET_LENGTH = 16

/**
 * Liveness check: returns 200 when the Node process and Next.js runtime respond.
 * Used by Docker health checks to decide container restarts.
 *
 * Deep check (optional): add ?deep=true with Authorization: Bearer STATUS_SECRET
 * to also verify DB connectivity. This is useful for monitoring dashboards but
 * should NOT be used by Docker healthcheck because a temporarily unreachable DB
 * should not restart the container.
 */
function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.STATUS_SECRET ?? ''
  const authorization = request.headers.get('authorization') ?? ''

  if (!configuredSecret || configuredSecret.length < MIN_STATUS_SECRET_LENGTH) return false
  if (!authorization.startsWith('Bearer ')) return false

  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return false

  return safeCompare(token, configuredSecret)
}

export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get('deep') === 'true'
  const noStoreHeaders = { 'Cache-Control': 'no-store' }

  if (!deep) {
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    }, {
      headers: noStoreHeaders,
    })
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: noStoreHeaders },
    )
  }

  // Deep health check includes DB connectivity.
  try {
    const payload = await getPayloadClient()
    await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      services: {
        app: 'ok',
        payload: 'ok',
        database: 'ok',
      },
    }, {
      headers: noStoreHeaders,
    })
  } catch (error) {
    logger.error('Healthcheck failed', error, 'health')
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        services: {
          app: 'degraded',
          payload: 'error',
          database: 'error',
        },
        error: 'Healthcheck failed',
      },
      { status: 503, headers: noStoreHeaders },
    )
  }
}
