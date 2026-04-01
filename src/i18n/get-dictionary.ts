import type { Locale } from './config'

// Lazy-import dictionaries so only the requested locale is bundled per request
const dictionaries = {
  en:  () => import('./dictionaries/en.json').then((m) => m.default),
  fr:  () => import('./dictionaries/fr.json').then((m) => m.default),
  mfe: () => import('./dictionaries/mfe.json').then((m) => m.default),
}

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)['en']>>

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]()
}
