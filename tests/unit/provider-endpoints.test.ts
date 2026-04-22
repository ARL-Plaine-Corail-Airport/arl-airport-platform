import { afterEach, describe, expect, it, vi } from 'vitest'

describe('provider endpoint validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses HTTPS defaults when endpoints are not configured', async () => {
    const {
      getConfiguredFlightProviderBaseUrl,
      getConfiguredWeatherProviderBaseUrl,
    } = await import('@/lib/provider-endpoints')

    expect(getConfiguredFlightProviderBaseUrl()).toBe('https://airlabs.co/api/v9')
    expect(getConfiguredWeatherProviderBaseUrl()).toBe(
      'https://api.open-meteo.com/v1/forecast',
    )
  })

  it('rejects non-HTTP provider endpoint schemes', async () => {
    vi.stubEnv('FLIGHT_PROVIDER_ENDPOINT', 'file:///etc/passwd')
    const { getConfiguredFlightProviderBaseUrl } = await import('@/lib/provider-endpoints')

    expect(() => getConfiguredFlightProviderBaseUrl()).toThrow(
      'FLIGHT_PROVIDER_ENDPOINT must use https: or http: in non-production.',
    )
  })

  it('rejects HTTP provider endpoints in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('WEATHER_PROVIDER_ENDPOINT', 'http://weather.example/forecast')
    const { getConfiguredWeatherProviderBaseUrl } = await import('@/lib/provider-endpoints')

    expect(() => getConfiguredWeatherProviderBaseUrl()).toThrow(
      'WEATHER_PROVIDER_ENDPOINT must use https:.',
    )
  })

  it('allows HTTP provider endpoints outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('FLIGHT_PROVIDER_ENDPOINT', 'http://localhost:8787/flights')
    const { getConfiguredFlightProviderBaseUrl } = await import('@/lib/provider-endpoints')

    expect(getConfiguredFlightProviderBaseUrl()).toBe('http://localhost:8787/flights')
  })
})
