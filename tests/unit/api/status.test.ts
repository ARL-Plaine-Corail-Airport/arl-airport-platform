import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  Redis,
  findGlobal,
  getPayloadClient,
  getSupabaseAdminClient,
  listBuckets,
  loggerError,
  redisPing,
  serverEnv,
} = vi.hoisted(() => {
  const findGlobal = vi.fn()
  const listBuckets = vi.fn()
  const redisPing = vi.fn()

  const Redis = vi.fn(function RedisMock() {
    return {
      ping: redisPing,
    }
  })

  return {
    Redis,
    findGlobal,
    getPayloadClient: vi.fn(() => Promise.resolve({ findGlobal })),
    getSupabaseAdminClient: vi.fn(() => ({
      storage: {
        listBuckets,
      },
    })),
    listBuckets,
    loggerError: vi.fn(),
    redisPing,
    serverEnv: {
      statusSecret: 'status-secret-min-16',
      upstashRedisRestUrl: 'https://redis.example.com',
      upstashRedisRestToken: 'redis-token',
    },
  }
})

vi.mock('@/lib/env.server', () => ({
  serverEnv,
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient,
}))

vi.mock('@/lib/storage/supabase-client', () => ({
  getSupabaseAdminClient,
}))

vi.mock('@upstash/redis', () => ({
  Redis,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

import { GET } from '@/app/api/status/route'

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/status', {
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : undefined,
  })
}

describe('status route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverEnv.statusSecret = 'status-secret-min-16'
    serverEnv.upstashRedisRestUrl = 'https://redis.example.com'
    serverEnv.upstashRedisRestToken = 'redis-token'
    findGlobal.mockResolvedValue({})
    listBuckets.mockResolvedValue({ data: [], error: null })
    redisPing.mockResolvedValue('PONG')
  })

  it('returns 401 without Authorization header', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, message: 'Unauthorized' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
    expect(Redis).not.toHaveBeenCalled()
  })

  it('returns 401 with wrong token', async () => {
    const response = await GET(makeRequest('wrong-token'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, message: 'Unauthorized' })
    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
    expect(Redis).not.toHaveBeenCalled()
  })

  it('returns 401 when the bearer token length differs from the configured secret', async () => {
    const response = await GET(makeRequest('status-secret-min-16-extra'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, message: 'Unauthorized' })
    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(getSupabaseAdminClient).not.toHaveBeenCalled()
    expect(Redis).not.toHaveBeenCalled()
  })

  it('returns healthy services with correct bearer token', async () => {
    const response = await GET(makeRequest('status-secret-min-16'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(typeof body.timestamp).toBe('string')
    expect(typeof body.uptimeSeconds).toBe('number')
    expect(body.services).toEqual({
      database: {
        status: 'ok',
        latencyMs: expect.any(Number),
      },
      redis: {
        status: 'ok',
        latencyMs: expect.any(Number),
      },
      storage: {
        status: 'ok',
        latencyMs: expect.any(Number),
      },
    })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(findGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })
    expect(Redis).toHaveBeenCalledWith({
      url: 'https://redis.example.com',
      token: 'redis-token',
    })
    expect(listBuckets).toHaveBeenCalled()
  })

  it('returns degraded when Redis is down but database is up', async () => {
    const error = new Error('redis down')
    redisPing.mockRejectedValue(error)

    const response = await GET(makeRequest('status-secret-min-16'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('degraded')
    expect(body.services.database.status).toBe('ok')
    expect(body.services.redis.status).toBe('error')
    expect(body.services.storage.status).toBe('ok')
    expect(loggerError).toHaveBeenCalledWith(
      'Status Redis check failed',
      error,
      'status',
    )
  })

  it('returns unhealthy when database is down', async () => {
    const error = new Error('db down')
    findGlobal.mockRejectedValue(error)

    const response = await GET(makeRequest('status-secret-min-16'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('unhealthy')
    expect(body.services.database.status).toBe('error')
    expect(loggerError).toHaveBeenCalledWith(
      'Status database check failed',
      error,
      'status',
    )
  })
})
