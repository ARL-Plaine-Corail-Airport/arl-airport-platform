/**
 * ARL Airport — Free Translation Service
 *
 * Uses the MyMemory API (api.mymemory.translated.net) for on-demand translation.
 * Free tier: 5 000 chars/day (anonymous), 50 000/day (with email).
 *
 * Supported language pairs:
 *   en ↔ fr   — full support
 *   en ↔ mfe  — limited (Mauritian Creole may fall back to French)
 *   fr ↔ mfe  — limited
 *
 * For Mauritian Creole, prefer the static dictionaries in src/i18n/dictionaries/.
 * This service is intended as a supplementary tool for dynamic CMS content.
 */

const MYMEMORY_BASE = 'https://api.mymemory.translated.net/get'

/** In-memory cache to avoid hitting the API for the same text repeatedly */
const translationCache = new Map<string, string>()

type TranslateOptions = {
  text: string
  from: string  // e.g. 'en'
  to: string    // e.g. 'fr' or 'mfe'
}

type MyMemoryResponse = {
  responseStatus: number
  responseData: {
    translatedText: string
    match: number
  }
}

/**
 * Translate a string using the MyMemory API.
 * Returns the original text on failure (graceful fallback).
 *
 * @example
 *   const french = await translate({ text: 'Hello', from: 'en', to: 'fr' })
 *   // → "Bonjour"
 */
export async function translate({ text, from, to }: TranslateOptions): Promise<string> {
  if (!text.trim()) return text
  if (from === to) return text

  const cacheKey = `${from}|${to}|${text}`
  const cached = translationCache.get(cacheKey)
  if (cached) return cached

  // MyMemory doesn't natively support 'mfe' — fall back to French for Creole
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

    if (!response.ok) return text

    const data: MyMemoryResponse = await response.json()

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText
      translationCache.set(cacheKey, translated)
      return translated
    }

    return text
  } catch {
    // Network error, timeout, or API issue — fail silently
    return text
  }
}

/**
 * Translate multiple strings in one call (batched sequentially to respect rate limits).
 */
export async function translateBatch(
  texts: string[],
  from: string,
  to: string,
): Promise<string[]> {
  if (from === to) return texts

  const results: string[] = []
  for (const text of texts) {
    results.push(await translate({ text, from, to }))
  }
  return results
}
