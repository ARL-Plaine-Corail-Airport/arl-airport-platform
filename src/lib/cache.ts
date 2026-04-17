import 'server-only'

import { Redis } from '@upstash/redis'

import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'

// Server-side cache with Redis (production) or in-memory (dev)
// Usage:
//   const data = await cachedFetch('flights:arrivals', 60, () => getFlightBoard('arrivals'))

const redis =
  serverEnv.upstashRedisRestUrl && serverEnv.upstashRedisRestToken
    ? new Redis({
        url: serverEnv.upstashRedisRestUrl,
        token: serverEnv.upstashRedisRestToken,
      })
    : null

// In-memory fallback for development (single-process only)
export const DEV_MEM_CACHE_MAX_ENTRIES = 100
const memCache = new Map<string, { data: string; expiresAt: number }>()
const inFlightFetches = new Map<string, Promise<unknown>>()

function pruneExpiredMemCache(now: number) {
  const staleKeys: string[] = []
  for (const [key, entry] of memCache) {
    if (entry.expiresAt <= now) {
      staleKeys.push(key)
    }
  }
  for (const key of staleKeys) {
    memCache.delete(key)
  }
}

function setMemCacheEntry(
  cacheKey: string,
  value: { data: string; expiresAt: number },
) {
  pruneExpiredMemCache(Date.now())

  if (!memCache.has(cacheKey)) {
    while (memCache.size >= DEV_MEM_CACHE_MAX_ENTRIES) {
      const oldestKey = memCache.keys().next().value
      if (oldestKey === undefined) break
      memCache.delete(oldestKey)
    }
  }

  memCache.set(cacheKey, value)
}

function refreshMemCacheEntry(cacheKey: string, entry: { data: string; expiresAt: number }) {
  memCache.delete(cacheKey)
  memCache.set(cacheKey, entry)
}

function deserializeCachedValue<T>(value: unknown): T | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (value === '') {
    return '' as T
  }

  if (typeof value !== 'string') {
    return value as T
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

function trackInFlightFetch<T>(
  cacheKey: string,
  fetchPromise: Promise<T>,
  options?: { background?: boolean },
): Promise<T> {
  const trackedPromise = options?.background
    ? fetchPromise.catch((error) => {
        logger.warn(
          `Background cache refresh failed for ${cacheKey}: ${error instanceof Error ? error.message : String(error)}`,
          'cache',
        )
        return undefined as T
      })
    : fetchPromise

  inFlightFetches.set(cacheKey, trackedPromise)

  trackedPromise.finally(() => {
    if (inFlightFetches.get(cacheKey) === trackedPromise) {
      inFlightFetches.delete(cacheKey)
    }
  })

  return trackedPromise
}

async function runFetchAndStore<T>(
  cacheKey: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: { shouldCache?: (data: T) => boolean },
): Promise<T> {
  const data = await fetcher()

  // Skip caching degraded/fallback payloads so transient failures don't persist for the full TTL
  if (options?.shouldCache && !options.shouldCache(data)) {
    return data
  }

  const serialized = JSON.stringify(data)

  if (redis) {
    try {
      await redis.set(cacheKey, serialized, { ex: ttlSeconds })
    } catch (error) {
      logger.error(`Redis cache write failed for ${cacheKey}`, error, 'cache')
    }
  } else {
    setMemCacheEntry(cacheKey, {
      data: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  return data
}

export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: { shouldCache?: (data: T) => boolean },
): Promise<T> {
  const cacheKey = `arl:cache:${key}`
  // Safe cast: each cache key must be associated with one fetcher result shape.
  // Callers must not reuse a key for different data contracts.
  const inFlight = inFlightFetches.get(cacheKey) as Promise<T> | undefined

  // Try reading from cache
  if (redis) {
    try {
      const cached = deserializeCachedValue<T>(await redis.get(cacheKey))
      if (cached !== undefined) {
        return cached
      }
    } catch (error) {
      logger.error(`Redis cache read failed for ${cacheKey}`, error, 'cache')
    }
  } else {
    const entry = memCache.get(cacheKey)
    if (entry) {
      const cached = deserializeCachedValue<T>(entry.data)

      if (entry.expiresAt > Date.now()) {
        if (cached !== undefined) {
          refreshMemCacheEntry(cacheKey, entry)
          return cached
        }
      } else if (cached !== undefined) {
        if (!inFlight) {
          void trackInFlightFetch(
            cacheKey,
            runFetchAndStore(cacheKey, ttlSeconds, fetcher, options),
            { background: true },
          )
        }

        refreshMemCacheEntry(cacheKey, entry)
        return cached
      }
    }
  }

  if (inFlight) {
    return inFlight
  }

  // Cache miss - fetch fresh data
  return await trackInFlightFetch(
    cacheKey,
    runFetchAndStore(cacheKey, ttlSeconds, fetcher, options),
  )
}
