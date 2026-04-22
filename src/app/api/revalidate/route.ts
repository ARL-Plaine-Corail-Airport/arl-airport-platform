import 'server-only'

import { Buffer } from 'node:buffer'
import { createHash, timingSafeEqual } from 'crypto'

import { Redis } from '@upstash/redis'
import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import { revalidateSchema } from '@/lib/validation'

export const maxDuration = 10

const REVALIDATE_COOLDOWN_MS = 5_000
const noStoreHeaders = { 'Cache-Control': 'no-store' }

let revalidateRedis: Redis | null | undefined
const localRevalidateCooldowns = new Map<string, number>()

function getRevalidateRedisClient(): Redis | null {
  if (revalidateRedis !== undefined) return revalidateRedis

  if (!serverEnv.upstashRedisRestUrl || !serverEnv.upstashRedisRestToken) {
    revalidateRedis = null
    return revalidateRedis
  }

  revalidateRedis = new Redis({
    url: serverEnv.upstashRedisRestUrl,
    token: serverEnv.upstashRedisRestToken,
  })

  return revalidateRedis
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

function getSecretHash(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

function cooldownKey(secretHash: string): string {
  return `arl:revalidate:cooldown:${secretHash}`
}

function consumeLocalRevalidateCooldown(secretHash: string): boolean {
  const now = Date.now()
  const activeUntil = localRevalidateCooldowns.get(secretHash)

  if (activeUntil && activeUntil > now) {
    return false
  }

  localRevalidateCooldowns.set(secretHash, now + REVALIDATE_COOLDOWN_MS)
  return true
}

async function consumeRevalidateCooldown(secret: string): Promise<boolean> {
  const redis = getRevalidateRedisClient()

  if (!redis) return true

  const secretHash = getSecretHash(secret)

  try {
    const result = await redis.set(cooldownKey(secretHash), '1', {
      nx: true,
      px: REVALIDATE_COOLDOWN_MS,
    })

    return result === 'OK'
  } catch (error) {
    logger.warn(
      `Revalidate cooldown check failed: ${error instanceof Error ? error.message : 'unknown'}`,
      'revalidate',
    )
    Sentry.addBreadcrumb({
      category: 'revalidate',
      level: 'warning',
      message: 'Revalidate cooldown Redis check failed; using local fallback',
    })
    return consumeLocalRevalidateCooldown(secretHash)
  }
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret') ?? ''
  const configuredSecret = serverEnv.revalidateSecret

  if (
    !configuredSecret ||
    configuredSecret.length < 16 ||
    !safeCompare(secret, configuredSecret)
  ) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: noStoreHeaders },
    )
  }

  const body = await request.json().catch(() => null)
  const result = revalidateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request' },
      { status: 400, headers: noStoreHeaders },
    )
  }

  const canRevalidate = await consumeRevalidateCooldown(secret)
  if (!canRevalidate) {
    return NextResponse.json(
      { ok: false, error: 'Revalidation cooldown active' },
      {
        status: 429,
        headers: {
          ...noStoreHeaders,
          'Retry-After': String(Math.ceil(REVALIDATE_COOLDOWN_MS / 1000)),
        },
      },
    )
  }

  const { paths } = result.data

  for (const path of paths) {
    revalidatePath(path)
  }

  return NextResponse.json({ ok: true, revalidated: paths })
}
