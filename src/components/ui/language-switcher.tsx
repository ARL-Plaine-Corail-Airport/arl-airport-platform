'use client'

import { useEffect, useState } from 'react'

import { isValidLocale, localeLabels, locales, type Locale } from '@/i18n/config'
import { localePath, stripLocalePrefix } from '@/i18n/path'
import { useI18n } from '@/i18n/provider'

export function LanguageSwitcher() {
  const { locale: contextLocale } = useI18n()
  const [activeLocale, setActiveLocale] = useState<Locale>(contextLocale)

  useEffect(() => {
    const segment = window.location.pathname.split('/').filter(Boolean)[0] ?? ''
    const browserLocale = isValidLocale(segment) ? segment : null

    if (browserLocale && browserLocale !== contextLocale) {
      setActiveLocale(browserLocale)
      return
    }

    setActiveLocale(contextLocale)
  }, [contextLocale])

  const handleChange = (newLocale: Locale) => {
    if (newLocale === activeLocale) return
    // Use hard navigation (not router.push) because locale changes require
    // the server layout to re-render with a new dictionary. Soft navigation
    // reuses the cached RSC payload since middleware rewrites all locales
    // to the same underlying route.
    const dest = localePath(stripLocalePrefix(window.location.pathname), newLocale)
    window.location.href = dest + window.location.search + window.location.hash
  }

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {locales.map((loc) => (
        <button
          type="button"
          key={loc}
          className={`lang-btn${loc === activeLocale ? ' lang-btn--active' : ''}`}
          onClick={() => handleChange(loc)}
          aria-current={loc === activeLocale ? 'true' : undefined}
          title={localeLabels[loc]}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
