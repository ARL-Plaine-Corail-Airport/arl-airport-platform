import { Redis } from '@upstash/redis'

import { serverEnv } from '@/lib/env'
import { logger } from '@/lib/logger'

// ─── Server-side cache with Redis (production) or in-memory (dev) ───────────
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

function deserializeCachedValue<T>(value: unknown): T | undefined {
  if (value === null || value === undefined) {
    return undefined
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

export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: { shouldCache?: (data: T) => boolean },
): Promise<T> {
  const cacheKey = `arl:cache:${key}`

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
    if (entry && entry.expiresAt > Date.now()) {
      const cached = deserializeCachedValue<T>(entry.data)

      if (cached !== undefined) {
        return cached
      }
    } else if (entry) {
      memCache.delete(cacheKey)
    }
  }

  // Cache miss — fetch fresh data
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
