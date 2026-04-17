import { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { createMock, getPayloadClient, loggerError } = vi.hoisted(() => {
  process.env.VISITOR_HASH_SALT ??= 'test-visitor-hash-salt'
  process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000'

  return {
    createMock: vi.fn(),
    getPayloadClient: vi.fn(),
    loggerError: vi.fn(),
  }
})

vi.mock('@/lib/payload', () => ({
  getPayloadClient,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

import { POST } from '@/app/api/track/route'

function hashVisitorForTest(ip: string, salt: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${salt}:${ip}:${date}`).digest('hex')
}

describe('track route', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('accepts public pageviews and defaults missing type for backward compatibility', async () => {
    getPayloadClient.mockResolvedValue({ create: createMock })

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      body: JSON.stringify({
        path: '/en/contact',
        referrer: null,
      }),
      headers: {
        'content-type': 'application/json',
        'accept-language': 'fr-FR,fr;q=0.9',
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'x-forwarded-for': '203.0.113.10',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({ ok: true })
    expect(getPayloadClient).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledWith({
      collection: 'page-views',
      data: expect.objectContaining({
        path: '/en/contact',
        referrer: 'direct',
        device: 'mobile',
        language: 'fr',
        visitorHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    })
    expect(createMock.mock.calls[0]?.[0].data.visitorHash).toBe(
      hashVisitorForTest('203.0.113.10', 'test-visitor-hash-salt'),
    )
  })

  it('rejects requests from foreign origins', async () => {
    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      body: JSON.stringify({
        type: 'pageview',
        path: '/en/contact',
      }),
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(403)
    await expect(response.text()).resolves.toBe('')
    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects admin, dashboard, and api paths', async () => {
    for (const path of ['/admin/login', '/dashboard', '/api/health']) {
      const request = new NextRequest('http://localhost/api/track', {
        method: 'POST',
        body: JSON.stringify({
          type: 'pageview',
          path,
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status, `expected ${path} to be rejected`).toBe(204)
      await expect(response.text()).resolves.toBe('')
    }

    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects locale-prefixed reserved paths after normalization', async () => {
    for (const path of ['/en/api/health', '/fr/dashboard', '/mfe/admin/login']) {
      const request = new NextRequest('http://localhost/api/track', {
        method: 'POST',
        body: JSON.stringify({
          type: 'pageview',
          path,
        }),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status, `expected ${path} to be rejected`).toBe(204)
      await expect(response.text()).resolves.toBe('')
    }

    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns a generic validation error without schema details', async () => {
    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      body: JSON.stringify({ type: 'pageview' }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid request' })
    expect(getPayloadClient).not.toHaveBeenCalled()
  })

  it('falls back to the next valid IP header when forwarded values are malformed', async () => {
    getPayloadClient.mockResolvedValue({ create: createMock })

    const requestWithInvalidForwardedIp = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      body: JSON.stringify({
        type: 'pageview',
        path: '/en/contact',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '999.999.999.999',
        'x-real-ip': '198.51.100.8',
      },
    })

    const requestWithRealIpOnly = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      body: JSON.stringify({
        type: 'pageview',
        path: '/en/contact',
      }),
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '198.51.100.8',
      },
    })

    const firstResponse = await POST(requestWithInvalidForwardedIp)
    const secondResponse = await POST(requestWithRealIpOnly)

    expect(firstResponse.status).toBe(201)
    expect(secondResponse.status).toBe(201)
    expect(createMock).toHaveBeenCalledTimes(2)

    const firstCall = createMock.mock.calls[0]?.[0]
    const secondCall = createMock.mock.calls[1]?.[0]
    expect(firstCall?.data.visitorHash).toBe(secondCall?.data.visitorHash)
  })

  it('rejects malformed IPv6 candidates and hashes the fallback unknown identity', async () => {
    getPayloadClient.mockResolvedValue({ create: createMock })

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      body: JSON.stringify({
        type: 'pageview',
        path: '/en/contact',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '2001:db8:::1',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock.mock.calls[0]?.[0].data.visitorHash).toBe(
      hashVisitorForTest('unknown', 'test-visitor-hash-salt'),
    )
  })

  it('logs unexpected create failures without exposing details to the client', async () => {
    const error = new Error('db down')
    getPayloadClient.mockResolvedValue({
      create: vi.fn().mockRejectedValue(error),
    })

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      body: JSON.stringify({
        type: 'pageview',
        path: '/en/contact',
      }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ ok: false })
    expect(loggerError).toHaveBeenCalledWith('Failed to record page view', error, 'track')
  })
})
