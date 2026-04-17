import { afterEach, describe, expect, it, vi } from 'vitest'

type CacheModuleOptions = {
  useRedis?: boolean
  getMock?: ReturnType<typeof vi.fn>
  setMock?: ReturnType<typeof vi.fn>
}

async function loadCacheModule(options: CacheModuleOptions = {}) {
  const {
    useRedis = false,
    getMock = vi.fn().mockResolvedValue(null),
    setMock = vi.fn().mockResolvedValue('OK'),
  } = options

  vi.resetModules()

  const loggerError = vi.fn()
  const Redis = vi.fn(function Redis() {
    return {
      get: getMock,
      set: setMock,
    }
  })

  vi.doMock('@/lib/env', () => ({
    serverEnv: {
      upstashRedisRestUrl: useRedis ? 'https://redis.example' : '',
      upstashRedisRestToken: useRedis ? 'token' : '',
    },
  }))

  vi.doMock('@/lib/logger', () => ({
    logger: {
      error: loggerError,
    },
  }))

  vi.doMock('@upstash/redis', () => ({
    Redis,
  }))

  const cacheModule = await import('@/lib/cache')

  return {
    ...cacheModule,
    Redis,
    loggerError,
    getMock,
    setMock,
  }
}

describe('cachedFetch runtime behavior', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('reuses the in-memory cache between calls', async () => {
    const { cachedFetch } = await loadCacheModule()
    const fetcher = vi.fn().mockResolvedValue({ value: 1 })

    const first = await cachedFetch('runtime-cache-hit', 60, fetcher)
    const second = await cachedFetch('runtime-cache-hit', 60, fetcher)

    expect(first).toEqual({ value: 1 })
    expect(second).toEqual({ value: 1 })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('skips caching when shouldCache rejects the payload', async () => {
    const { cachedFetch } = await loadCacheModule()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ value: 1, degraded: true })
      .mockResolvedValueOnce({ value: 2, degraded: true })

    const first = await cachedFetch('runtime-cache-skip', 60, fetcher, {
      shouldCache: (data: { value: number; degraded: boolean }) => !data.degraded,
    })
    const second = await cachedFetch('runtime-cache-skip', 60, fetcher, {
      shouldCache: (data: { value: number; degraded: boolean }) => !data.degraded,
    })

    expect(first).toEqual({ value: 1, degraded: true })
    expect(second).toEqual({ value: 2, degraded: true })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('evicts the oldest dev cache entry when the max size is exceeded', async () => {
    const { cachedFetch, DEV_MEM_CACHE_MAX_ENTRIES } = await loadCacheModule()

    for (let i = 0; i < DEV_MEM_CACHE_MAX_ENTRIES; i++) {
      await cachedFetch(`runtime-cache-${i}`, 60, async () => ({ value: i }))
    }

    const fetcher = vi.fn().mockResolvedValue({ value: 'refetched' })

    await cachedFetch('runtime-cache-overflow', 60, async () => ({ value: 'overflow' }))
    const result = await cachedFetch('runtime-cache-0', 60, fetcher)

    expect(result).toEqual({ value: 'refetched' })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('treats Redis read failures as cache misses', async () => {
    const readError = new Error('read failed')
    const getMock = vi.fn().mockRejectedValue(readError)
    const setMock = vi.fn().mockResolvedValue('OK')
    const { cachedFetch, loggerError } = await loadCacheModule({
      useRedis: true,
      getMock,
      setMock,
    })
    const fetcher = vi.fn().mockResolvedValue({ value: 1 })

    const result = await cachedFetch('redis-read-failure', 60, fetcher)

    expect(result).toEqual({ value: 1 })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(setMock).toHaveBeenCalledOnce()
    expect(loggerError).toHaveBeenCalledWith(
      'Redis cache read failed for arl:cache:redis-read-failure',
      readError,
      'cache',
    )
  })

  it('returns fresh data even when Redis writes fail', async () => {
    const writeError = new Error('write failed')
    const setMock = vi.fn().mockRejectedValue(writeError)
    const { cachedFetch, loggerError } = await loadCacheModule({
      useRedis: true,
      getMock: vi.fn().mockResolvedValue(null),
      setMock,
    })
    const fetcher = vi.fn().mockResolvedValue({ value: 2 })

    const result = await cachedFetch('redis-write-failure', 60, fetcher)

    expect(result).toEqual({ value: 2 })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(setMock).toHaveBeenCalledOnce()
    expect(loggerError).toHaveBeenCalledWith(
      'Redis cache write failed for arl:cache:redis-write-failure',
      writeError,
      'cache',
    )
  })
})
