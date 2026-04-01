'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { isValidLocale, localeLabels, locales, type Locale } from '@/i18n/config'
import { localePath, stripLocalePrefix } from '@/i18n/path'
import { useI18n } from '@/i18n/provider'

export function LanguageSwitcher() {
  const { locale: contextLocale } = useI18n()
  const router = useRouter()
  const pathname = usePathname()

  // Middleware rewrites locale-prefixed URLs (e.g. /fr/arrivals → /arrivals),
  // so usePathname() can return the rewritten path without the locale prefix.
  // Read from window.location.pathname instead, which always reflects the
  // actual browser URL including the locale segment.
  const [activeLocale, setActiveLocale] = useState<Locale>(contextLocale)

  useEffect(() => {
    const segment = window.location.pathname.split('/').filter(Boolean)[0] ?? ''
    setActiveLocale(isValidLocale(segment) ? segment : contextLocale)
  }, [pathname, contextLocale])

  const handleChange = (newLocale: Locale) => {
    if (newLocale === activeLocale) return
    setActiveLocale(newLocale)
    router.push(localePath(stripLocalePrefix(window.location.pathname), newLocale))
  }

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {locales.map((loc) => (
        <button
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
