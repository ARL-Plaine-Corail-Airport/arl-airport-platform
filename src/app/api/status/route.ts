import 'server-only'

import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'crypto'

import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { getSupabaseAdminClient } from '@/lib/storage/supabase-client'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'ok' | 'error' | 'not_configured'

type ServiceCheck = {
  status: ServiceStatus
  latencyMs: number
}

const noStoreHeaders = { 'Cache-Control': 'no-store' }

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

function latencySince(start: number) {
  return Math.round(performance.now() - start)
}

function isAuthorized(request: NextRequest) {
  const configuredSecret = serverEnv.statusSecret
  const authorization = request.headers.get('authorization') ?? ''

  if (!configuredSecret || configuredSecret.length < 16) return false
  if (!authorization.startsWith('Bearer ')) return false

  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return false

  return safeCompare(token, configuredSecret)
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
  } catch (error) {
    logger.error('Status database check failed', error, 'status')
    return { status: 'error', latencyMs: latencySince(start) }
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const start = performance.now()

  if (!serverEnv.upstashRedisRestUrl) {
    return { status: 'not_configured', latencyMs: 0 }
  }

  try {
    const redis = new Redis({
      url: serverEnv.upstashRedisRestUrl,
      token: serverEnv.upstashRedisRestToken,
    })

    await redis.ping()
    return { status: 'ok', latencyMs: latencySince(start) }
  } catch (error) {
    logger.error('Status Redis check failed', error, 'status')
    return { status: 'error', latencyMs: latencySince(start) }
  }
}

async function checkStorage(): Promise<ServiceCheck> {
  const start = performance.now()

  try {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.storage.listBuckets()

    if (error) {
      throw error
    }

    return { status: 'ok', latencyMs: latencySince(start) }
  } catch (error) {
    logger.error('Status storage check failed', error, 'status')
    return { status: 'error', latencyMs: latencySince(start) }
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, message: 'Unauthorized' },
      { status: 401, headers: noStoreHeaders },
    )
  }

  const [database, redis, storage] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
  ])

  const services = {
    database,
    redis,
    storage,
  }

  const status =
    database.status === 'error'
      ? 'unhealthy'
      : redis.status === 'error' || storage.status === 'error'
        ? 'degraded'
        : 'healthy'

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services,
    },
    { headers: noStoreHeaders },
  )
}
