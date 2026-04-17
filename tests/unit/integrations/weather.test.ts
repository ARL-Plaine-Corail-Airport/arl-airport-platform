import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WeatherResponse } from '@/lib/integrations/weather/types'

const loggerError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

async function loadWeather(fetchMock: ReturnType<typeof vi.fn>) {
  vi.resetModules()
  vi.stubEnv('WEATHER_PROVIDER_ENDPOINT', 'https://weather.example.com/v1/forecast')
  vi.stubEnv('WEATHER_PROVIDER_LATITUDE', '-19.757778')
  vi.stubEnv('WEATHER_PROVIDER_LONGITUDE', '63.361389')
  vi.stubEnv('WEATHER_PROVIDER_TIMEZONE', 'Indian/Mauritius')
  vi.doMock('@/lib/env.server', () => ({
    serverEnv: {
      weatherProviderEndpoint: 'https://weather.example.com/v1/forecast',
      weatherProviderLabel: process.env.WEATHER_PROVIDER_LABEL || 'Open-Meteo Forecast API',
      weatherProviderLatitude: -19.757778,
      weatherProviderLongitude: 63.361389,
      weatherProviderTimezone: 'Indian/Mauritius',
    },
  }))

  vi.stubGlobal('fetch', fetchMock)

  return import('@/lib/integrations/weather')
}

function expectFallback(weather: WeatherResponse) {
  expect(weather).toEqual({
    configured: true,
    providerLabel: 'Open-Meteo Forecast API',
    fetchedAt: null,
    summary: 'Live weather is temporarily unavailable.',
    visibility: null,
    temperatureC: null,
    warning: null,
  })
}

describe('weather integration', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    loggerError.mockReset()
  })

  it('returns shaped weather data for a successful Open-Meteo response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        current: {
          temperature_2m: 27.34,
          weather_code: 0,
          visibility: 12345,
          wind_gusts_10m: 20,
        },
      }),
    })
    const { getWeatherSnapshot } = await loadWeather(fetchMock)

    const weather = await getWeatherSnapshot()

    expect(weather).toMatchObject({
      configured: true,
      providerLabel: 'Open-Meteo Forecast API',
      summary: 'Clear sky',
      visibility: 12.3,
      temperatureC: 27.3,
      warning: null,
    })
    expect(typeof weather.fetchedAt).toBe('string')
  })

  it('returns fallback weather data for HTTP errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn(),
    })
    const { getWeatherSnapshot } = await loadWeather(fetchMock)

    const weather = await getWeatherSnapshot()

    expectFallback(weather)
    expect(loggerError).toHaveBeenCalledOnce()
  })

  it('uses the server-side provider label when configured for a self-hosted endpoint', async () => {
    vi.stubEnv('WEATHER_PROVIDER_LABEL', 'Self-hosted Open-Meteo')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        current: {
          temperature_2m: 27,
          weather_code: 1,
          visibility: 10000,
          wind_gusts_10m: 10,
        },
      }),
    })
    const { getWeatherSnapshot } = await loadWeather(fetchMock)

    const weather = await getWeatherSnapshot()

    expect(weather.providerLabel).toBe('Self-hosted Open-Meteo')
  })

  it('returns fallback weather data for network timeouts', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const fetchMock = vi.fn().mockRejectedValue(abortError)
    const { getWeatherSnapshot } = await loadWeather(fetchMock)

    const weather = await getWeatherSnapshot()

    expectFallback(weather)
    expect(loggerError).toHaveBeenCalledWith(
      'Failed to fetch weather snapshot',
      abortError,
      'weather',
    )
  })

  it('returns fallback weather data for malformed JSON responses', async () => {
    const error = new SyntaxError('bad json')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(error),
    })
    const { getWeatherSnapshot } = await loadWeather(fetchMock)

    const weather = await getWeatherSnapshot()

    expectFallback(weather)
    expect(loggerError).toHaveBeenCalledWith(
      'Failed to fetch weather snapshot',
      error,
      'weather',
    )
  })

  it('passes configured coordinates and timezone in the fetch URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        current: {
          temperature_2m: 25,
          weather_code: 3,
          visibility: 8000,
          wind_gusts_10m: 55,
        },
      }),
    })
    const { getWeatherSnapshot } = await loadWeather(fetchMock)

    await getWeatherSnapshot()

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.origin).toBe('https://weather.example.com')
    expect(url.pathname).toBe('/v1/forecast')
    expect(url.searchParams.get('latitude')).toBe('-19.757778')
    expect(url.searchParams.get('longitude')).toBe('63.361389')
    expect(url.searchParams.get('timezone')).toBe('Indian/Mauritius')
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,weather_code,visibility,wind_gusts_10m',
    )
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 300,
      },
    })
  })
})
