import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { Redis, findGlobal, getPayloadClient, redisPing, serverEnv } = vi.hoisted(() => {
  const findGlobal = vi.fn()
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
    redisPing,
    serverEnv: {
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

vi.mock('@upstash/redis', () => ({
  Redis,
}))

import { GET } from '@/app/api/ready/route'

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/ready', {
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : undefined,
  })
}

describe('ready route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverEnv.upstashRedisRestUrl = 'https://redis.example.com'
    serverEnv.upstashRedisRestToken = 'redis-token'
    findGlobal.mockResolvedValue({})
    redisPing.mockResolvedValue('PONG')
  })

  it('returns ready when the database and configured Redis are reachable', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(body.status).toBe('ready')
    expect(body.ok).toBe(true)
    expect(typeof body.timestamp).toBe('string')
    expect(body.services).toEqual({
      database: {
        status: 'ok',
        latencyMs: expect.any(Number),
      },
      redis: {
        status: 'ok',
        latencyMs: expect.any(Number),
      },
    })
    expect(findGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })
    expect(Redis).toHaveBeenCalledWith({
      url: 'https://redis.example.com',
      token: 'redis-token',
    })
    expect(redisPing).toHaveBeenCalledTimes(1)
  })

  it('does not require auth and still sends no-store', async () => {
    const response = await GET(makeRequest('wrong-token'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(body.ok).toBe(true)
    expect(getPayloadClient).toHaveBeenCalledTimes(1)
    expect(Redis).toHaveBeenCalledTimes(1)
  })

  it('returns 503 when the database check fails', async () => {
    findGlobal.mockRejectedValue(new Error('db down'))

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(body.ok).toBe(false)
    expect(body.status).toBe('not_ready')
    expect(body.services.database.status).toBe('error')
    expect(body.services.redis.status).toBe('ok')
  })

  it('returns 503 when configured Redis ping fails', async () => {
    redisPing.mockRejectedValue(new Error('redis down'))

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(body.ok).toBe(false)
    expect(body.status).toBe('not_ready')
    expect(body.services.database.status).toBe('ok')
    expect(body.services.redis.status).toBe('error')
  })

  it('treats missing Redis configuration as ready and not_configured', async () => {
    serverEnv.upstashRedisRestUrl = ''
    serverEnv.upstashRedisRestToken = ''

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(body.ok).toBe(true)
    expect(body.status).toBe('ready')
    expect(body.services.redis).toEqual({
      status: 'not_configured',
      latencyMs: 0,
    })
    expect(Redis).not.toHaveBeenCalled()
    expect(redisPing).not.toHaveBeenCalled()
  })

  it('does not check Redis when only one Redis credential is configured', async () => {
    serverEnv.upstashRedisRestUrl = 'https://redis.example.com'
    serverEnv.upstashRedisRestToken = ''

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.services.redis.status).toBe('not_configured')
    expect(Redis).not.toHaveBeenCalled()
    expect(redisPing).not.toHaveBeenCalled()
  })
})
