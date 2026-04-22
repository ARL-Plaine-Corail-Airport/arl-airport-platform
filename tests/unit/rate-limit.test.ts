import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { getRateLimitKey } from '@/lib/rate-limit'

const originalNodeEnv = process.env.NODE_ENV

describe('rate limit key helper', () => {
  afterEach(() => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
  })

  it('uses the first valid forwarded IP address', () => {
    const request = new NextRequest('http://localhost/api/weather', {
      headers: {
        'x-forwarded-for': '203.0.113.42, 198.51.100.10',
        'x-real-ip': '198.51.100.20',
      },
    })

    expect(getRateLimitKey(request, '/api/weather')).toBe('203.0.113.42')
  })

  it('falls back to a rich anonymous fingerprint when IP headers are invalid', () => {
    const request = new NextRequest('http://localhost/api/weather', {
      headers: {
        accept: 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua': '"Chromium"',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'RateLimitTest/1.0',
        'x-forwarded-for': 'not-an-ip',
        'x-real-ip': 'still-not-an-ip',
      },
    })

    expect(getRateLimitKey(request, '/api/weather')).toBe(
      'anon:GET:/api/weather:RateLimitTest/1.0:en-US,en;q=0.9:application/json:"Chromium":same-origin',
    )
  })

  it('does not treat malformed IPv6-like values as trusted IPs', () => {
    const firstRequest = new NextRequest('http://localhost/api/weather', {
      headers: {
        'user-agent': 'RateLimitTest/1.0',
        'x-forwarded-for': 'abc',
      },
    })
    const secondRequest = new NextRequest('http://localhost/api/weather', {
      headers: {
        'user-agent': 'RateLimitTest/1.0',
        'x-forwarded-for': ':::',
      },
    })

    expect(getRateLimitKey(firstRequest, '/api/weather')).toBe(
      'anon:GET:/api/weather:RateLimitTest/1.0',
    )
    expect(getRateLimitKey(secondRequest, '/api/weather')).toBe(
      'anon:GET:/api/weather:RateLimitTest/1.0',
    )
  })

  it('coalesces production anonymous requests without a trusted proxy IP', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'

    const firstRequest = new NextRequest('http://localhost/api/weather', {
      headers: {
        'user-agent': 'RateLimitTest/1.0',
      },
    })
    const secondRequest = new NextRequest('http://localhost/api/weather', {
      headers: {
        'user-agent': 'RotatedAgent/2.0',
      },
    })

    expect(getRateLimitKey(firstRequest, '/api/weather')).toBe('anon:no-ip')
    expect(getRateLimitKey(secondRequest, '/api/weather')).toBe('anon:no-ip')
  })

  it('keeps the fallback stable for repeated equivalent anonymous requests', () => {
    const headers = {
      accept: 'application/json',
      'accept-language': 'fr',
      'user-agent': 'RateLimitTest/1.0',
    }
    const firstRequest = new NextRequest('http://localhost/api/payload', { headers })
    const secondRequest = new NextRequest('http://localhost/api/payload', { headers })

    expect(getRateLimitKey(firstRequest, '/api/payload')).toBe(
      getRateLimitKey(secondRequest, '/api/payload'),
    )
  })
})
