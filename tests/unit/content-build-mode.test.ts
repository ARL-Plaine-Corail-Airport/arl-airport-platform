import { afterEach, describe, expect, it, vi } from 'vitest'

import { BuildTimeDbDisabledError } from '@/lib/build-db'
import { defaultHomePage, defaultSiteSettings } from '@/lib/defaults'

describe('content fallbacks during build-time DB skip', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('returns defaults without logging when Payload is disabled for build', async () => {
    const getPayloadClient = vi.fn(async () => {
      throw new BuildTimeDbDisabledError()
    })
    const loggerError = vi.fn()

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient,
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: loggerError,
      },
    }))

    const { getHomePage, getPublishedPages, getSiteSettings } = await import('@/lib/content')

    await expect(getSiteSettings()).resolves.toEqual(defaultSiteSettings)
    await expect(getHomePage()).resolves.toEqual(defaultHomePage)
    await expect(getPublishedPages()).resolves.toEqual([])
    expect(loggerError).not.toHaveBeenCalled()
  })

  it('still logs unexpected runtime DB failures', async () => {
    const error = new Error('database offline')
    const getPayloadClient = vi.fn(async () => {
      throw error
    })
    const loggerError = vi.fn()

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient,
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: loggerError,
      },
    }))

    const { getPublishedPages } = await import('@/lib/content')

    await expect(getPublishedPages()).resolves.toEqual([])
    expect(loggerError).toHaveBeenCalledWith('Failed to fetch published pages', error, 'content')
  })

  it('normalizes legacy airport naming from persisted site settings', async () => {
    const legacySettings = {
      ...defaultSiteSettings,
      airportName: 'Sir Gaetan Duval Airport',
      physicalAddress: 'Sir Gaetan Duval Airport, Rodrigues Island, Republic of Mauritius',
    }
    const getPayloadClient = vi.fn(async () => ({
      findGlobal: vi.fn(async () => legacySettings),
    }))

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient,
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: vi.fn(),
      },
    }))

    const { getSiteSettings } = await import('@/lib/content')

    await expect(getSiteSettings()).resolves.toMatchObject({
      airportName: 'Plaine Corail Airport',
      physicalAddress: 'Plaine Corail Airport, Rodrigues Island, Republic of Mauritius',
    })
  })
})
