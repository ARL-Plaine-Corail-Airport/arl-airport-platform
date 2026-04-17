import { describe, expect, it } from 'vitest'

import { env } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

describe('env', () => {
  it('exposes public env with sensible defaults', () => {
    expect(env.siteURL).toBeTruthy()
  })

  it('resolves weather provider defaults when unconfigured', () => {
    expect(env.weatherProviderMode).toBeTruthy()
    expect(env.weatherProviderLabel).toBeTruthy()
  })
})

describe('serverEnv', () => {
  it('exposes server env with sensible defaults', () => {
    expect(serverEnv.siteUrl).toBeTruthy()
    expect(serverEnv.visitorHashSalt).toBeTruthy()
    expect(serverEnv.flightProviderMode).toBe('airlabs')
    expect(serverEnv.flightProviderLabel).toBe('AirLabs')
    expect(serverEnv.flightProviderIataCode).toBe('RRG')
    expect(serverEnv.weatherProviderLabel).toBe('Open-Meteo Forecast API')
    expect(serverEnv.s3Region).toBe('eu-west-1')
    expect(serverEnv.mediaBucket).toBe('arl-public-media')
  })

  it('provides default coordinates for Plaine Corail', () => {
    expect(serverEnv.weatherProviderLatitude).toBeCloseTo(-19.757778, 3)
    expect(serverEnv.weatherProviderLongitude).toBeCloseTo(63.361389, 3)
  })
})
