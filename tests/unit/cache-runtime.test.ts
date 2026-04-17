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

  vi.doMock('@/lib/env.server', () => ({
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
    vi.useRealTimers()
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

  it('treats empty cached strings as valid values', async () => {
    const { cachedFetch, getMock, setMock } = await loadCacheModule({
      useRedis: true,
      getMock: vi.fn().mockResolvedValue(''),
      setMock: vi.fn().mockResolvedValue('OK'),
    })

    const fetcher = vi.fn()
    const result = await cachedFetch('redis-empty-string', 60, fetcher)

    expect(result).toBe('')
    expect(fetcher).not.toHaveBeenCalled()
    expect(getMock).toHaveBeenCalledOnce()
    expect(setMock).not.toHaveBeenCalled()
  })

  it('deduplicates concurrent cache misses through a shared in-flight fetch', async () => {
    const { cachedFetch } = await loadCacheModule()
    let resolveFetch: ((value: { value: string }) => void) | undefined
    const fetchPromise = new Promise<{ value: string }>((resolve) => {
      resolveFetch = resolve
    })
    const fetcher = vi.fn().mockReturnValue(fetchPromise)

    const firstCall = cachedFetch('shared-in-flight', 60, fetcher)
    const secondCall = cachedFetch('shared-in-flight', 60, fetcher)

    resolveFetch?.({ value: 'fresh' })

    await expect(firstCall).resolves.toEqual({ value: 'fresh' })
    await expect(secondCall).resolves.toEqual({ value: 'fresh' })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('serves stale dev cache entries while a refresh is revalidating in the background', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-09T00:00:00.000Z'))

    const { cachedFetch } = await loadCacheModule()

    await cachedFetch('stale-while-revalidate', 1, async () => ({ value: 'old' }))
    vi.setSystemTime(new Date('2026-04-09T00:00:02.000Z'))

    let resolveRefresh: ((value: { value: string }) => void) | undefined
    const refreshPromise = new Promise<{ value: string }>((resolve) => {
      resolveRefresh = resolve
    })
    const fetcher = vi.fn().mockReturnValue(refreshPromise)

    const staleResult = await cachedFetch('stale-while-revalidate', 1, fetcher)
    expect(staleResult).toEqual({ value: 'old' })
    expect(fetcher).toHaveBeenCalledOnce()

    resolveRefresh?.({ value: 'fresh' })
    await refreshPromise
    await Promise.resolve()

    const freshResult = await cachedFetch('stale-while-revalidate', 1, fetcher)
    expect(freshResult).toEqual({ value: 'fresh' })
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
