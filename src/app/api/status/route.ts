import 'server-only'

import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'crypto'

import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { redactSensitiveText } from '@/lib/redaction'
import { getSupabaseAdminClient } from '@/lib/storage/supabase-client'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'ok' | 'error' | 'not_configured'

type ServiceCheck = {
  status: ServiceStatus
  latencyMs: number
}

const noStoreHeaders = { 'Cache-Control': 'no-store' }
const MIN_STATUS_SECRET_LENGTH = 16

// Skip the assertion during `next build` — secrets are injected at runtime, not
// at build time. The Dockerfile sets NEXT_OUTPUT_MODE=standalone for the build
// stage; at runtime it is unset. `isAuthorized` still enforces the length
// requirement on every request, so runtime misconfiguration fails closed.
if (
  process.env.NODE_ENV === 'production' &&
  !process.env.NEXT_OUTPUT_MODE &&
  serverEnv.statusSecret.length < MIN_STATUS_SECRET_LENGTH
) {
  throw new Error('STATUS_SECRET must be at least 16 characters in production')
}

let statusRedis: Redis | null | undefined

function getStatusRedisClient(): Redis | null {
  if (statusRedis !== undefined) return statusRedis

  if (!serverEnv.upstashRedisRestUrl || !serverEnv.upstashRedisRestToken) {
    statusRedis = null
    return statusRedis
  }

  statusRedis = new Redis({
    url: serverEnv.upstashRedisRestUrl,
    token: serverEnv.upstashRedisRestToken,
  })

  return statusRedis
}

function getUrlPassword(value: string): string {
  try {
    return decodeURIComponent(new URL(value).password)
  } catch {
    return ''
  }
}

function redactStatusError(error: unknown): unknown {
  const secrets = [
    serverEnv.upstashRedisRestToken,
    serverEnv.s3SecretAccessKey,
    serverEnv.payloadSecret,
    serverEnv.visitorHashSalt,
    getUrlPassword(serverEnv.databaseURL),
    getUrlPassword(serverEnv.databaseDirectURL),
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ].filter((secret): secret is string => Boolean(secret))

  if (error instanceof Error) {
    const message = redactSensitiveText(error.message, secrets)
    const stack = error.stack ? redactSensitiveText(error.stack, secrets) : undefined

    if (message === error.message && stack === error.stack) {
      return error
    }

    const redacted = new Error(message)
    redacted.name = error.name
    redacted.stack = stack
    return redacted
  }

  if (typeof error === 'string') {
    return redactSensitiveText(error, secrets)
  }

  return error
}

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

  if (!configuredSecret || configuredSecret.length < MIN_STATUS_SECRET_LENGTH) return false
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
    logger.error('Status database check failed', redactStatusError(error), 'status')
    return { status: 'error', latencyMs: latencySince(start) }
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const start = performance.now()

  if (!serverEnv.upstashRedisRestUrl) {
    return { status: 'not_configured', latencyMs: 0 }
  }

  try {
    const redis = getStatusRedisClient()

    if (!redis) {
      return { status: 'error', latencyMs: latencySince(start) }
    }

    await redis.ping()
    return { status: 'ok', latencyMs: latencySince(start) }
  } catch (error) {
    logger.error('Status Redis check failed', redactStatusError(error), 'status')
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
    logger.error('Status storage check failed', redactStatusError(error), 'status')
    return { status: 'error', latencyMs: latencySince(start) }
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
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
      ok: status !== 'unhealthy',
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services,
    },
    { headers: noStoreHeaders },
  )
}
