import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { cachedFetch, getFlightBoards } = vi.hoisted(() => ({
  cachedFetch: vi.fn(),
  getFlightBoards: vi.fn(),
}))
const { loggerError, loggerWarn } = vi.hoisted(() => ({
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
}))

vi.mock('@/lib/cache', () => ({
  cachedFetch,
}))

vi.mock('@/lib/integrations/flights', () => ({
  getFlightBoards,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
    warn: loggerWarn,
  },
}))

import { GET } from '@/app/api/flight-board/route'

const arrivalsPayload = {
  configured: true,
  providerLabel: 'AirLabs',
  boardType: 'arrivals' as const,
  fetchedAt: '2026-04-07T10:00:00.000Z',
  message: '1 arrivals found.',
  records: [],
  degraded: false,
}

const departuresPayload = {
  configured: true,
  providerLabel: 'AirLabs',
  boardType: 'departures' as const,
  fetchedAt: '2026-04-07T10:00:00.000Z',
  message: '1 departures found.',
  records: [],
  degraded: false,
}

describe('flight board route', () => {
  beforeEach(() => {
    cachedFetch.mockImplementation(async (_key, _ttl, fetcher) => fetcher())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to arrivals when no type query parameter is present', async () => {
    getFlightBoards.mockResolvedValue({
      arrivals: arrivalsPayload,
      departures: departuresPayload,
      degraded: false,
    })

    const response = await GET(new NextRequest('http://localhost/api/flight-board'))

    expect(response.status).toBe(200)
    expect(cachedFetch).toHaveBeenCalledWith(
      'flights:rotations',
      2600,
      getFlightBoards,
      expect.objectContaining({
        shouldCache: expect.any(Function),
      }),
    )
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=2600, stale-while-revalidate=7200',
    )
    await expect(response.json()).resolves.toEqual(arrivalsPayload)
  })

  it('passes departures through from the shared snapshot', async () => {
    getFlightBoards.mockResolvedValue({
      arrivals: arrivalsPayload,
      departures: departuresPayload,
      degraded: false,
    })

    const response = await GET(
      new NextRequest('http://localhost/api/flight-board?type=departures'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(departuresPayload)
  })

  it('returns no-store for degraded flight board snapshots', async () => {
    getFlightBoards.mockResolvedValue({
      arrivals: {
        ...arrivalsPayload,
        degraded: true,
        message: 'Fallback data',
      },
      departures: {
        ...departuresPayload,
        degraded: true,
        message: 'Fallback data',
      },
      degraded: true,
    })

    const response = await GET(new NextRequest('http://localhost/api/flight-board'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('returns a generic no-store 400 for invalid board types', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/flight-board?type=delayed'),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid request' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid flight board request'),
      'flight-board',
    )
    expect(cachedFetch).not.toHaveBeenCalled()
  })

  it('returns a stable 500 response when an unexpected error escapes', async () => {
    cachedFetch.mockRejectedValue(new Error('boom'))

    const response = await GET(new NextRequest('http://localhost/api/flight-board'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(loggerError).toHaveBeenCalledOnce()
  })

  it('returns a guarded 502 when the requested board type is missing from the payload', async () => {
    getFlightBoards.mockResolvedValue({
      departures: departuresPayload,
      degraded: false,
    } as never)

    const response = await GET(
      new NextRequest('http://localhost/api/flight-board?type=arrivals'),
    )
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toEqual({ error: 'Board type unavailable' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(loggerError).not.toHaveBeenCalled()
  })
})
