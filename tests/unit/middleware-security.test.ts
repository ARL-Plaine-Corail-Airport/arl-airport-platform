import { afterEach, describe, expect, it, vi } from 'vitest'

const originalNodeEnv = process.env.NODE_ENV
const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL
const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
const originalPayloadSecret = process.env.PAYLOAD_SECRET
const originalFlightProviderEndpoint = process.env.FLIGHT_PROVIDER_ENDPOINT
const originalWeatherProviderEndpoint = process.env.WEATHER_PROVIDER_ENDPOINT
const testPayloadSecret = 'middleware-test-payload-secret-min-32-characters'
const loggerError = vi.fn()

function base64UrlEncode(value: string | Uint8Array): string {
  return Buffer.from(value).toString('base64url')
}

async function buildSignedJwt(
  payloadData: Record<string, unknown>,
  secret = testPayloadSecret,
): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify(payloadData))
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`)),
  )

  return `${header}.${payload}.${base64UrlEncode(signature)}`
}

async function buildExpiredJwt(expirationSecondsAgo = 60) {
  return await buildSignedJwt({
    exp: Math.floor(Date.now() / 1000) - expirationSecondsAgo,
  })
}

function buildForgedJwt(payloadData: Record<string, unknown>) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify(payloadData))

  return `${header}.${payload}.signature`
}

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
  restoreEnv('PAYLOAD_SECRET', testPayloadSecret)
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
    restoreEnv('PAYLOAD_SECRET', originalPayloadSecret)
    restoreEnv('FLIGHT_PROVIDER_ENDPOINT', originalFlightProviderEndpoint)
    restoreEnv('WEATHER_PROVIDER_ENDPOINT', originalWeatherProviderEndpoint)
    vi.resetModules()
    vi.restoreAllMocks()
    loggerError.mockReset()
  })

  it('sets a nonce-based CSP header on app routes', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/en/contact'))
    const csp = response.headers.get('Content-Security-Policy')

    expect(csp).toContain("script-src 'self' 'nonce-")
    expect(csp).toContain(
      "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com https://www.gravatar.com https://secure.gravatar.com",
    )
    expect(csp).toContain(
      "connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://airlabs.co",
    )
  })

  it('derives CSP connect-src provider origins from configured endpoints', async () => {
    process.env.FLIGHT_PROVIDER_ENDPOINT = 'https://flight-provider.example/api/v1'
    process.env.WEATHER_PROVIDER_ENDPOINT = 'https://weather-provider.example/forecast'
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/en/contact'))
    const csp = response.headers.get('Content-Security-Policy')

    expect(csp).toContain(
      "connect-src 'self' https://*.supabase.co https://weather-provider.example https://flight-provider.example",
    )
    expect(csp).not.toContain('https://api.open-meteo.com')
    expect(csp).not.toContain('https://airlabs.co')
  })

  it('sets production locale cookies with the secure flag', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/en/contact'))

    expect(response.headers.get('set-cookie')).toContain('locale=en')
    expect(response.headers.get('set-cookie')).toContain('Secure')
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
    const csp = response.headers.get('Content-Security-Policy')

    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain(
      "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com https://www.gravatar.com https://secure.gravatar.com",
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

    expect(englishResponse.status).toBe(307)
    expect(englishResponse.headers.get('location')).toContain('/en/contact')

    const frenchResponse = await middleware(new NextRequest('http://localhost/contact', {
      headers: {
        'accept-language': 'de-DE,de;q=0.9,fr;q=0.8,en;q=0.7',
      },
    }))

    expect(frenchResponse.status).toBe(307)
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

  it('redirects obviously expired dashboard JWT cookies before server-side auth', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${await buildExpiredJwt()}`,
      },
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/admin/login?redirect=%2Fdashboard')
  })

  it('redirects forged future dashboard JWT cookies before server-side auth', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${buildForgedJwt({
          exp: Math.floor(Date.now() / 1000) + 3600,
        })}`,
      },
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/admin/login?redirect=%2Fdashboard')
  })

  it('passes browser dashboard RSC fetches through to server-side auth', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
      },
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('redirects locale-prefixed dashboard and admin URLs to canonical unprefixed paths', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const dashboardResponse = await middleware(
      new NextRequest('http://localhost/en/dashboard?tab=overview'),
    )
    const adminResponse = await middleware(
      new NextRequest('http://localhost/fr/admin/login?redirect=%2Fdashboard'),
    )

    expect(dashboardResponse.status).toBe(308)
    expect(dashboardResponse.headers.get('location')).toBe(
      'http://localhost/dashboard?tab=overview',
    )
    expect(dashboardResponse.headers.get('Cache-Control')).toBe('private, no-store')
    expect(adminResponse.status).toBe(308)
    expect(adminResponse.headers.get('location')).toBe(
      'http://localhost/admin/login?redirect=%2Fdashboard',
    )
    expect(adminResponse.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('allows signed unexpired dashboard JWT cookies to reach dashboard handoff', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()

    const response = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${await buildSignedJwt({
          exp: Math.floor(Date.now() / 1000) + 3600,
        })}`,
      },
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('caches dashboard JWT verification for repeated token checks', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()
    const payloadToken = await buildSignedJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    const verifySpy = vi.spyOn(crypto.subtle, 'verify')

    const firstResponse = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${payloadToken}`,
      },
    }))
    const secondResponse = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${payloadToken}`,
      },
    }))

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(verifySpy).toHaveBeenCalledOnce()
  })

  it('reuses the imported dashboard JWT key across different tokens for one secret', async () => {
    const { middleware, NextRequest } = await loadProductionSecurityModules()
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    const firstToken = await buildSignedJwt({ exp: expiresAt, jti: 'first-token' })
    const secondToken = await buildSignedJwt({ exp: expiresAt, jti: 'second-token' })
    const importKeySpy = vi.spyOn(crypto.subtle, 'importKey')
    const verifySpy = vi.spyOn(crypto.subtle, 'verify')

    const firstResponse = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${firstToken}`,
      },
    }))
    const secondResponse = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${secondToken}`,
      },
    }))

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(verifySpy).toHaveBeenCalledTimes(2)
    expect(importKeySpy).toHaveBeenCalledOnce()
  })

  it('refreshes the imported dashboard JWT key when the secret changes', async () => {
    const rotatedSecret = 'rotated-middleware-test-secret-min-32-characters'
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    const firstToken = await buildSignedJwt({ exp: expiresAt, jti: 'before-rotate' })
    const secondToken = await buildSignedJwt(
      { exp: expiresAt, jti: 'after-rotate' },
      rotatedSecret,
    )
    const { middleware, NextRequest } = await loadProductionSecurityModules()
    const importKeySpy = vi.spyOn(crypto.subtle, 'importKey')

    const firstResponse = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${firstToken}`,
      },
    }))

    process.env.PAYLOAD_SECRET = rotatedSecret
    const secondResponse = await middleware(new NextRequest('http://localhost/dashboard', {
      headers: {
        cookie: `payload-token=${secondToken}`,
      },
    }))

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(importKeySpy).toHaveBeenCalledTimes(2)
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

  it('derives a stable fallback fingerprint when IP headers are missing', async () => {
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

    const firstResponse = await middleware(new NextRequest('http://localhost/api/weather'))
    const secondResponse = await middleware(new NextRequest('http://localhost/api/weather'))

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(limitMock).toHaveBeenCalledTimes(2)

    const firstKey = limitMock.mock.calls[0]?.[0]
    const secondKey = limitMock.mock.calls[1]?.[0]

    expect(firstKey).toMatch(/^anon:/)
    expect(secondKey).toMatch(/^anon:/)
    expect(firstKey).not.toBe('anonymous')
    expect(secondKey).not.toBe('anonymous')
    expect(firstKey).toBe(secondKey)
    expect(firstResponse.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(firstResponse.headers.get('X-RateLimit-Remaining')).toBe('59')
  })
})
