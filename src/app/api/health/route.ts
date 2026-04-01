import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

export async function GET() {
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
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        services: {
          app: 'ok',
          payload: 'error',
          database: 'error',
        },
        error: error instanceof Error ? error.message : 'Unknown healthcheck error',
      },
      { status: 503 },
    )
  }
}
