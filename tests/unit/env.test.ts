import { describe, expect, it } from 'vitest'

import { env, serverEnv } from '@/lib/env'

describe('env', () => {
  it('exposes public env with sensible defaults', () => {
    expect(env.siteURL).toBeTruthy()
    expect(env.flightProviderMode).toBe('airlabs')
    expect(env.flightProviderLabel).toBe('AirLabs')
  })

  it('resolves weather provider defaults when unconfigured', () => {
    expect(env.weatherProviderMode).toBeTruthy()
    expect(env.weatherProviderLabel).toBeTruthy()
  })
})

describe('serverEnv', () => {
  it('exposes server env with sensible defaults', () => {
    expect(serverEnv.flightProviderIataCode).toBe('RRG')
    expect(serverEnv.s3Region).toBe('eu-west-1')
    expect(serverEnv.mediaBucket).toBe('arl-public-media')
  })

  it('provides default coordinates for Plaine Corail', () => {
    expect(serverEnv.weatherProviderLatitude).toBeCloseTo(-19.757778, 3)
    expect(serverEnv.weatherProviderLongitude).toBeCloseTo(63.361389, 3)
  })
})
