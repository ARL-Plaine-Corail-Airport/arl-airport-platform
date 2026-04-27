import 'server-only'

import { NextResponse, type NextRequest } from 'next/server'

import { serverEnv } from '@/lib/env.server'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'ok' | 'error' | 'not_configured'

type ServiceCheck = {
  status: ServiceStatus
  latencyMs: number
}

const noStoreHeaders = { 'Cache-Control': 'no-store' }

function latencySince(start: number) {
  return Math.round(performance.now() - start)
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = performance.now()

  try {
    const payload = await getPayloadClient()
    await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })

    return { status: 'ok', latencyMs: latencySince(start) }
  } catch {
    return { status: 'error', latencyMs: latencySince(start) }
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  if (!serverEnv.upstashRedisRestUrl || !serverEnv.upstashRedisRestToken) {
    return { status: 'not_configured', latencyMs: 0 }
  }

  const start = performance.now()

  try {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({
      url: serverEnv.upstashRedisRestUrl,
      token: serverEnv.upstashRedisRestToken,
    })

    await redis.ping()
    return { status: 'ok', latencyMs: latencySince(start) }
  } catch {
    return { status: 'error', latencyMs: latencySince(start) }
  }
}

export async function GET(_request: NextRequest) {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()])
  const ready = database.status === 'ok' && redis.status !== 'error'

  return NextResponse.json(
    {
      ok: ready,
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: noStoreHeaders,
    },
  )
}
