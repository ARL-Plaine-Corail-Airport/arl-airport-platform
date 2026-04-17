import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Liveness check — always returns 200 if the Node process is alive.
 * Used by Docker health checks to decide container restarts.
 *
 * Deep check (optional): add ?deep=true to also verify DB connectivity.
 * This is useful for monitoring dashboards but should NOT be used by Docker
 * healthcheck — a temporarily unreachable DB shouldn't restart the container.
 */
export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get('deep') === 'true'

  if (!deep) {
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    })
  }

  // Deep health check — includes DB connectivity
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
    })
  } catch (error) {
    logger.error('Healthcheck failed', error, 'health')
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        services: {
          app: 'ok',
          payload: 'error',
          database: 'error',
        },
        error: 'Healthcheck failed',
      },
      { status: 503 },
    )
  }
}
