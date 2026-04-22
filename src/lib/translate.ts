import { createHash } from 'node:crypto'

import { logger } from '@/lib/logger'

const MYMEMORY_BASE = 'https://api.mymemory.translated.net/get'

const MAX_TRANSLATION_LENGTH = 5000
const TRANSLATION_RATE_LIMIT_MAX_REQUESTS = 20
const TRANSLATION_RATE_LIMIT_WINDOW_MS = 60_000
const CACHE_MAX_SIZE = 1000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const TRANSLATE_BATCH_SIZE = 5
const translationCache = new Map<string, { value: string; expiresAt: number }>()
const translationRateWindows = new Map<number, number>()
const warnedMfeFallbacks = new Set<string>()

type TranslateOptions = {
  text: string
  from: string
  to: string
}

type MyMemoryResponse = {
  responseStatus: number
  responseData: {
    translatedText: string
    match: number
  }
}

function getCachedTranslation(key: string): string | undefined {
  const entry = translationCache.get(key)
  if (!entry) return undefined

  if (entry.expiresAt <= Date.now()) {
    translationCache.delete(key)
    return undefined
  }

  // Promote to most-recently-used by re-inserting (Map preserves insertion order).
  translationCache.delete(key)
  translationCache.set(key, entry)

  return entry.value
}

function pruneExpiredTranslations(now: number): void {
  for (const [key, entry] of translationCache) {
    if (entry.expiresAt <= now) {
      translationCache.delete(key)
    }
  }
}

function setCachedTranslation(key: string, value: string): void {
  const now = Date.now()

  pruneExpiredTranslations(now)

  // Delete existing entry first so the new one lands at the tail (MRU position).
  translationCache.delete(key)

  while (translationCache.size >= CACHE_MAX_SIZE) {
    const lruKey = translationCache.keys().next().value
    if (lruKey === undefined) break
    translationCache.delete(lruKey)
  }

  translationCache.set(key, { value, expiresAt: now + CACHE_TTL_MS })
}

function buildTranslationCacheKey({ text, from, to }: TranslateOptions): string {
  const digest = createHash('sha256').update(text).digest('hex')
  return `${from}|${to}|${text.length}|${digest}`
}

function warnMfeFallbackOnce(input: {
  cacheKey: string
  effectiveFrom: string
  effectiveTo: string
  from: string
  to: string
}) {
  if (input.from !== 'mfe' && input.to !== 'mfe') return

  const warningKey = `${input.cacheKey}|${input.to}`
  if (warnedMfeFallbacks.has(warningKey)) return
  warnedMfeFallbacks.add(warningKey)

  logger.warn(
    `Kreol translation fallback used for ${input.from}|${input.to}; using ${input.effectiveFrom}|${input.effectiveTo}`,
    'translate',
  )
}

function canTranslate(now = Date.now()): boolean {
  const windowStart =
    Math.floor(now / TRANSLATION_RATE_LIMIT_WINDOW_MS) *
    TRANSLATION_RATE_LIMIT_WINDOW_MS

  for (const key of translationRateWindows.keys()) {
    if (key < windowStart) {
      translationRateWindows.delete(key)
    }
  }

  const requestsInWindow = translationRateWindows.get(windowStart) ?? 0

  if (requestsInWindow >= TRANSLATION_RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  translationRateWindows.set(windowStart, requestsInWindow + 1)
  return true
}

export async function translate({ text, from, to }: TranslateOptions): Promise<string> {
  if (!text.trim()) return text
  if (from === to) return text
  if (text.length > MAX_TRANSLATION_LENGTH) {
    logger.warn(
      `Translation skipped: input exceeds ${MAX_TRANSLATION_LENGTH} characters`,
      'translate',
    )
    return text
  }

  const cacheKey = buildTranslationCacheKey({ text, from, to })
  const cached = getCachedTranslation(cacheKey)
  if (cached) return cached

  if (!canTranslate()) {
    logger.warn('Translation rate limit reached', 'translate')
    return text
  }

  // MyMemory does not support Kreol Morisien (mfe). Fall back to French
  // as the closest available language. CMS editors should provide native
  // Kreol translations via localized fields instead of auto-translation.
  const effectiveTo = to === 'mfe' ? 'fr' : to
  const effectiveFrom = from === 'mfe' ? 'fr' : from
  warnMfeFallbackOnce({ cacheKey, effectiveFrom, effectiveTo, from, to })

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${effectiveFrom}|${effectiveTo}`,
    })

    const response = await fetch(`${MYMEMORY_BASE}?${params}`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      logger.error(
        'Translation request failed',
        `HTTP ${response.status}`,
        'translate',
      )
      return text
    }

    const data: MyMemoryResponse = await response.json()

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText
      setCachedTranslation(cacheKey, translated)
      return translated
    }

    logger.error(
      'Translation response did not contain translated text',
      `status=${data.responseStatus}`,
      'translate',
    )
    return text
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.warn(`Translation failed: ${errorMessage}`, 'translate')
    return text
  }
}

export async function translateBatch(
  texts: string[],
  from: string,
  to: string,
): Promise<string[]> {
  if (from === to) return texts

  const results: string[] = []

  for (let i = 0; i < texts.length; i += TRANSLATE_BATCH_SIZE) {
    const batch = texts.slice(i, i + TRANSLATE_BATCH_SIZE)
    const translated = await Promise.all(batch.map((text) => translate({ text, from, to })))
    results.push(...translated)
  }

  return results
}
