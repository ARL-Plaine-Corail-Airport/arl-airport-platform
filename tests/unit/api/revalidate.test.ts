import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { addBreadcrumb, loggerWarn, revalidatePath } = vi.hoisted(() => ({
  addBreadcrumb: vi.fn(),
  loggerWarn: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath,
}))

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: loggerWarn,
  },
}))

vi.mock('@/lib/env.server', () => ({
  serverEnv: {
    revalidateSecret: 'supersecret-12345',
  },
}))

import { POST } from '@/app/api/revalidate/route'

describe('revalidate route', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the secret header is missing', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact'] }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, error: 'Unauthorized' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns 401 when the secret is invalid', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'wrongsecret',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, error: 'Unauthorized' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns 401 when the secret has the wrong length', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345-extra',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, error: 'Unauthorized' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates each provided path when the secret is valid', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact', '/notices'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      revalidated: ['/contact', '/notices'],
    })
    expect(revalidatePath).toHaveBeenCalledTimes(2)
    expect(revalidatePath).toHaveBeenNthCalledWith(1, '/contact')
    expect(revalidatePath).toHaveBeenNthCalledWith(2, '/notices')
  })

  it('returns 400 when the payload is empty', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ ok: false, error: 'Invalid request' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns 400 and skips revalidation for malformed paths', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/../../etc/passwd', '//dashboard'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ ok: false, error: 'Invalid request' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('uses a local cooldown fallback when Redis cooldown checks fail', async () => {
    vi.resetModules()

    const redisSet = vi.fn().mockRejectedValue(new Error('redis down'))
    const Redis = vi.fn(function Redis() {
      return { set: redisSet }
    })

    vi.doMock('@upstash/redis', () => ({
      Redis,
    }))

    vi.doMock('@/lib/env.server', () => ({
      serverEnv: {
        revalidateSecret: 'supersecret-12345',
        upstashRedisRestUrl: 'https://redis.example',
        upstashRedisRestToken: 'token',
      },
    }))

    const { POST: postWithRedis } = await import('@/app/api/revalidate/route')

    const buildRequest = () => new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345',
      },
    })

    const firstResponse = await postWithRedis(buildRequest())
    const secondResponse = await postWithRedis(buildRequest())

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(429)
    await expect(secondResponse.json()).resolves.toEqual({
      ok: false,
      error: 'Revalidation cooldown active',
    })
    expect(redisSet).toHaveBeenCalledTimes(2)
    expect(loggerWarn).toHaveBeenCalledWith(
      'Revalidate cooldown check failed: redis down',
      'revalidate',
    )
    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: 'revalidate',
      level: 'warning',
      message: 'Revalidate cooldown Redis check failed; using local fallback',
    })
  })
})
