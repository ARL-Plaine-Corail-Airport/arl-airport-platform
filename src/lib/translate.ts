import { logger } from '@/lib/logger'

const MYMEMORY_BASE = 'https://api.mymemory.translated.net/get'

const CACHE_MAX_SIZE = 1000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const translationCache = new Map<string, { value: string; cachedAt: number }>()

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

export async function translate({ text, from, to }: TranslateOptions): Promise<string> {
  if (!text.trim()) return text
  if (from === to) return text

  const cacheKey = `${from}|${to}|${text}`
  const cached = getCachedTranslation(cacheKey)
  if (cached) return cached

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

  return Promise.all(texts.map((text) => translate({ text, from, to })))
}
