import { afterEach, describe, expect, it, vi } from 'vitest'

const { cachedFetch, getWeatherSnapshot } = vi.hoisted(() => ({
  cachedFetch: vi.fn(),
  getWeatherSnapshot: vi.fn(),
}))
const { loggerError } = vi.hoisted(() => ({
  loggerError: vi.fn(),
}))

vi.mock('@/lib/cache', () => ({
  cachedFetch,
}))

vi.mock('@/lib/integrations/weather', () => ({
  getWeatherSnapshot,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

import { GET } from '@/app/api/weather/route'

describe('weather route', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns cacheable headers for healthy weather snapshots', async () => {
    const payload = {
      configured: true,
      providerLabel: 'Open-Meteo Forecast API',
      fetchedAt: '2026-04-07T10:00:00.000Z',
      summary: 'Clear sky',
      visibility: 10,
      temperatureC: 28,
      warning: null,
    }

    cachedFetch.mockResolvedValue(payload)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(payload)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600',
    )
  })

  it('returns no-store when the weather snapshot is degraded', async () => {
    const payload = {
      configured: true,
      providerLabel: 'Open-Meteo Forecast API',
      fetchedAt: null,
      summary: 'Unavailable',
      visibility: null,
      temperatureC: null,
      warning: null,
    }

    cachedFetch.mockResolvedValue(payload)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(payload)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('returns a stable 500 response when an unexpected error escapes', async () => {
    cachedFetch.mockRejectedValue(new Error('boom'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(loggerError).toHaveBeenCalledOnce()
  })
})
