'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Locale } from './config'
import type { Dictionary } from './get-dictionary'
import { localePath as buildLocalePath } from './path'

type I18nContextValue = {
  locale: Locale
  dict: Dictionary
  /** Helper: resolve a dotted key like "nav.flights" from the dictionary */
  t: (key: string) => string
  /** Prefix a path with the current locale: localePath('/arrivals') → '/en/arrivals' */
  localePath: (path: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

/**
 * Wrap the app in this provider (inside the frontend layout).
 * Server components should use `getDictionary()` directly instead.
 */
export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale
  dictionary: Dictionary
  children: ReactNode
}) {
  const t = (key: string): string => {
    const parts = key.split('.')
    let result: unknown = dictionary
    for (const part of parts) {
      if (result && typeof result === 'object' && part in result) {
        result = (result as Record<string, unknown>)[part]
      } else {
        return key // fallback: return the key itself
      }
    }
    return typeof result === 'string' ? result : key
  }

  const localePath = (path: string) => buildLocalePath(path, locale)

  return (
    <I18nContext.Provider value={{ locale, dict: dictionary, t, localePath }}>
      {children}
    </I18nContext.Provider>
  )
}

/**
 * Client hook — returns { locale, dict, t, localePath }.
 * `t("nav.flights")` resolves a dotted path from the dictionary.
 * `localePath("/arrivals")` returns the locale-prefixed path.
 */
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
