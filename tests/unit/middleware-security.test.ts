import { afterEach, describe, expect, it, vi } from 'vitest'

const originalNodeEnv = process.env.NODE_ENV
const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL
const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
const loggerError = vi.fn()

function restoreEnv(
  key: string,
  value: string | undefined,
) {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}

async function loadProductionSecurityModules() {
  ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
  restoreEnv('UPSTASH_REDIS_REST_URL', undefined)
  restoreEnv('UPSTASH_REDIS_REST_TOKEN', undefined)
  vi.resetModules()
  vi.doMock('@/lib/logger', () => ({
    logger: {
      error: loggerError,
    },
  }))

  const [{ default: nextConfig }, { middleware }, { NextRequest }] = await Promise.all([
    import('../../next.config.mjs'),
    import('@/middleware'),
    import('next/server'),
  ])

  return { nextConfig, middleware, NextRequest }
}

describe('middleware security', () => {
  afterEach(() => {
    restoreEnv('NODE_ENV', originalNodeEnv)
    restoreEnv('UPSTASH_REDIS_REST_URL', originalUpstashUrl)
    restoreEnv('UPSTASH_REDIS_REST_TOKEN', originalUpstashToken)
    vi.resetModules()
    vi.restoreAllMocks()
    loggerError.mockReset()
  })

  it('sets a nonce-based CSP header on app routes', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/en/contact'))

    expect(response.headers.get('Content-Security-Policy')).toContain(
      "script-src 'self' 'nonce-",
    )
    expect(response.headers.get('x-nonce')).toBeTruthy()
  })

  it('sets HSTS and SAMEORIGIN frame protection in production headers', async () => {
    const { nextConfig } = await loadProductionSecurityModules()

    const headersConfig = await nextConfig.headers()
    const appHeaders = headersConfig.find(
      (entry: { source: string }) => entry.source === '/:path*',
    )?.headers

    expect(appHeaders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        }),
        expect.objectContaining({
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        }),
      ]),
    )
  })

  it('uses the looser admin CSP without a nonce on admin routes', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/admin/login'))

    expect(response.headers.get('Content-Security-Policy')).toContain(
      "script-src 'self' 'unsafe-inline'",
    )
    expect(response.headers.get('x-nonce')).toBeNull()
  })

  it('honors the highest-priority supported Accept-Language entry for public redirects', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const englishResponse = await middleware(new NextRequest('http://localhost/contact', {
      headers: {
        'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
      },
    }))

    expect(englishResponse.headers.get('location')).toContain('/en/contact')

    const frenchResponse = await middleware(new NextRequest('http://localhost/contact', {
      headers: {
        'accept-language': 'de-DE,de;q=0.9,fr;q=0.8,en;q=0.7',
      },
    }))

    expect(frenchResponse.headers.get('location')).toContain('/fr/contact')
  })

  it('keeps cookie locale preference ahead of Accept-Language redirects', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/contact', {
      headers: {
        'accept-language': 'fr-FR,fr;q=0.9',
        cookie: 'locale=en',
      },
    }))

    expect(response.headers.get('location')).toContain('/en/contact')
  })

  it('fails open when the Upstash rate limiter throws', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    ;(process.env as Record<string, string | undefined>).UPSTASH_REDIS_REST_URL = 'https://redis.example'
    ;(process.env as Record<string, string | undefined>).UPSTASH_REDIS_REST_TOKEN = 'token'
    vi.resetModules()

    const rateLimitError = new Error('upstash unavailable')
    const limitMock = vi.fn().mockRejectedValue(rateLimitError)
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: loggerError,
      },
    }))

    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class MockRatelimit {
        static slidingWindow() {
          return 'window'
        }

        limit = limitMock
      },
    }))

    vi.doMock('@upstash/redis/cloudflare', () => ({
      Redis: class MockRedis {},
    }))

    const [{ middleware }, { NextRequest }] = await Promise.all([
      import('@/middleware'),
      import('next/server'),
    ])

    const response = await middleware(new NextRequest('http://localhost/api/weather'))

    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBeNull()
    expect(response.headers.get('X-RateLimit-Remaining')).toBeNull()
    expect(limitMock).toHaveBeenCalledOnce()
    expect(loggerError).toHaveBeenCalledWith(
      'Rate limit check failed',
      rateLimitError,
      'middleware',
    )
  })

  it('uses the anonymous rate-limit bucket when IP headers are missing', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    ;(process.env as Record<string, string | undefined>).UPSTASH_REDIS_REST_URL = 'https://redis.example'
    ;(process.env as Record<string, string | undefined>).UPSTASH_REDIS_REST_TOKEN = 'token'
    vi.resetModules()
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: loggerError,
      },
    }))

    const limitMock = vi.fn().mockResolvedValue({ success: true, remaining: 59 })

    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class MockRatelimit {
        static slidingWindow() {
          return 'window'
        }

        limit = limitMock
      },
    }))

    vi.doMock('@upstash/redis/cloudflare', () => ({
      Redis: class MockRedis {},
    }))

    const [{ middleware }, { NextRequest }] = await Promise.all([
      import('@/middleware'),
      import('next/server'),
    ])

    const response = await middleware(new NextRequest('http://localhost/api/weather'))

    expect(response.status).toBe(200)
    expect(limitMock).toHaveBeenCalledWith('anonymous')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59')
  })
})
