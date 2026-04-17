import { describe, expect, it } from 'vitest'

/**
 * Tests that the weather provider configuration is locked to Open-Meteo.
 * The env module always resolves weatherProviderMode to 'open-meteo'
 * regardless of environment variables, because the adapter only speaks
 * the Open-Meteo protocol.
 */

describe('weather provider configuration', () => {
  it('weatherProviderMode is always open-meteo', async () => {
    // We import env dynamically to pick up the hardcoded value
    const { env } = await import('@/lib/env')
    expect(env.weatherProviderMode).toBe('open-meteo')
  })

  it('weatherProviderLabel is always Open-Meteo Forecast API', async () => {
    const { env } = await import('@/lib/env')
    expect(env.weatherProviderLabel).toBe('Open-Meteo Forecast API')
  })

  it('weatherProviderEndpoint falls back to the public Open-Meteo URL', async () => {
    const { serverEnv } = await import('@/lib/env')
    // When WEATHER_PROVIDER_ENDPOINT is not set, should default to Open-Meteo
    expect(serverEnv.weatherProviderEndpoint).toContain('open-meteo.com')
  })
})
