import { afterEach, describe, expect, it, vi } from 'vitest'

const originalBuildFlag = process.env.ARL_SKIP_DB_DURING_BUILD

describe('flight board build-time fallback', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()

    if (originalBuildFlag === undefined) {
      delete process.env.ARL_SKIP_DB_DURING_BUILD
    } else {
      process.env.ARL_SKIP_DB_DURING_BUILD = originalBuildFlag
    }
  })

  it('skips manual CMS flight lookups during build without logging', async () => {
    process.env.ARL_SKIP_DB_DURING_BUILD = '1'

    const getPayloadClient = vi.fn()
    const loggerError = vi.fn()

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient,
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: loggerError,
      },
    }))

    const { getFlightBoard } = await import('@/lib/integrations/flights')
    const result = await getFlightBoard('arrivals')

    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(loggerError).not.toHaveBeenCalled()
    expect(result.records).toEqual([])
    expect(result.configured).toBe(false)
  })
})
