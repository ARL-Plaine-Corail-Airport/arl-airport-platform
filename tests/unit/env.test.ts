import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { env } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

const originalDatabaseURL = process.env.DATABASE_URL
const originalNextOutputMode = process.env.NEXT_OUTPUT_MODE
const originalNodeEnv = process.env.NODE_ENV
const originalPayloadSecret = process.env.PAYLOAD_SECRET

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}

afterEach(() => {
  restoreEnv('DATABASE_URL', originalDatabaseURL)
  restoreEnv('NEXT_OUTPUT_MODE', originalNextOutputMode)
  restoreEnv('NODE_ENV', originalNodeEnv)
  restoreEnv('PAYLOAD_SECRET', originalPayloadSecret)
  vi.restoreAllMocks()
  vi.resetModules()
})

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
    expect(serverEnv.flightProviderEndpoint).toBe(serverEnv.flightProviderBaseUrl)
    expect(serverEnv.flightProviderIataCode).toBe('RRG')
    expect(serverEnv.weatherProviderLabel).toBe('Open-Meteo Forecast API')
    expect(serverEnv.weatherProviderEndpoint).toBe(serverEnv.weatherProviderBaseUrl)
    expect(serverEnv.s3Region).toBe('eu-west-1')
    expect(serverEnv.mediaBucket).toBe('arl-public-media')
  })

  it('provides default coordinates for Plaine Corail', () => {
    expect(serverEnv.weatherProviderLatitude).toBeCloseTo(-19.757778, 3)
    expect(serverEnv.weatherProviderLongitude).toBeCloseTo(63.361389, 3)
  })

  it('uses a warned sentinel for missing required env during build output mode', async () => {
    delete process.env.DATABASE_URL
    delete process.env.PAYLOAD_SECRET
    process.env.NEXT_OUTPUT_MODE = 'standalone'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.resetModules()

    const { serverEnv: buildServerEnv } = await import('@/lib/env.server')

    expect(buildServerEnv.databaseURL).toBe('__BUILD_TIME_UNSET__')
    expect(buildServerEnv.payloadSecret).toBe('__BUILD_TIME_UNSET__')
    expect(warnSpy).toHaveBeenCalledWith(
      '[env] Missing required environment variable PAYLOAD_SECRET during build; using __BUILD_TIME_UNSET__.',
    )
    expect(warnSpy).toHaveBeenCalledWith(
      '[env] Missing required environment variable DATABASE_URL during build; using __BUILD_TIME_UNSET__.',
    )
  })

  it('does not expose .env.example dead-secret placeholders in production runtime env', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    const example = readFileSync(join(process.cwd(), '.env.example'), 'utf8')
    const placeholders = Array.from(
      new Set(example.match(/CHANGE_ME_USE_[A-Za-z0-9_]+/g) ?? []),
    )

    const leaked = Object.entries(process.env)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .filter(([, value]) => placeholders.some((placeholder) => value.includes(placeholder)))

    expect(placeholders.length).toBeGreaterThan(0)
    expect(leaked).toEqual([])
  })
})
