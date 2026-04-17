import { afterEach, describe, expect, it, vi } from 'vitest'

const originalBuildFlag = process.env.ARL_SKIP_DB_DURING_BUILD

describe('getPayloadClient build guard', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()

    if (originalBuildFlag === undefined) {
      delete process.env.ARL_SKIP_DB_DURING_BUILD
    } else {
      process.env.ARL_SKIP_DB_DURING_BUILD = originalBuildFlag
    }
  })

  it('throws the build-time DB sentinel when DB access is disabled', async () => {
    process.env.ARL_SKIP_DB_DURING_BUILD = '1'

    const getPayload = vi.fn()

    vi.doMock('@payload-config', () => ({
      default: {},
    }))
    vi.doMock('payload', () => ({
      getPayload,
    }))

    const { BuildTimeDbDisabledError } = await import('@/lib/build-db')
    const { getPayloadClient } = await import('@/lib/payload')

    await expect(getPayloadClient()).rejects.toBeInstanceOf(BuildTimeDbDisabledError)
    expect(getPayload).not.toHaveBeenCalled()
  })

  it('uses Payload normally when build-time DB access is enabled', async () => {
    delete process.env.ARL_SKIP_DB_DURING_BUILD

    const payloadClient = { find: vi.fn() }
    const getPayload = vi.fn(async () => payloadClient)

    vi.doMock('@payload-config', () => ({
      default: {},
    }))
    vi.doMock('payload', () => ({
      getPayload,
    }))

    const { getPayloadClient } = await import('@/lib/payload')

    await expect(getPayloadClient()).resolves.toBe(payloadClient)
    expect(getPayload).toHaveBeenCalledOnce()
  })
})
