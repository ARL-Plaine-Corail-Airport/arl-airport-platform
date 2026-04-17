import { logger } from '@/lib/logger'

const MYMEMORY_BASE = 'https://api.mymemory.translated.net/get'

const MAX_TRANSLATION_LENGTH = 5000
const TRANSLATION_RATE_LIMIT_MAX_REQUESTS = 20
const TRANSLATION_RATE_LIMIT_WINDOW_MS = 60_000
const CACHE_MAX_SIZE = 1000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const TRANSLATE_BATCH_SIZE = 5
const translationCache = new Map<string, { value: string; cachedAt: number }>()
let translationWindowStart = 0
let translationRequestsInWindow = 0

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

  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    translationCache.delete(key)
    return undefined
  }

  return entry.value
}

function setCachedTranslation(key: string, value: string): void {
  const now = Date.now()
  const staleKeys: string[] = []
  for (const [k, entry] of translationCache) {
    if (now - entry.cachedAt > CACHE_TTL_MS) {
      staleKeys.push(k)
    }
  }
  for (const staleKey of staleKeys) {
    translationCache.delete(staleKey)
  }
  if (translationCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = translationCache.keys().next().value
    if (oldestKey !== undefined) translationCache.delete(oldestKey)
  }

  translationCache.set(key, { value, cachedAt: now })
}

function canTranslate(now = Date.now()): boolean {
  if (
    translationWindowStart === 0 ||
    now - translationWindowStart >= TRANSLATION_RATE_LIMIT_WINDOW_MS
  ) {
    translationWindowStart = now
    translationRequestsInWindow = 0
  }

  if (translationRequestsInWindow >= TRANSLATION_RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  translationRequestsInWindow++
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

  const cacheKey = `${from}|${to}|${text}`
  const cached = getCachedTranslation(cacheKey)
  if (cached) return cached

  if (!canTranslate()) {
    logger.warn('Translation rate limit reached', 'translate')
    return text
  }

  const effectiveTo = to === 'mfe' ? 'fr' : to
  const effectiveFrom = from === 'mfe' ? 'fr' : from

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
