'use client'

import { localeLabels, locales, type Locale } from '@/i18n/config'
import { localePath, stripLocalePrefix } from '@/i18n/path'
import { useI18n } from '@/i18n/provider'

type LanguageSwitcherProps = {
  currentLocale?: Locale
  currentPathname?: string
}

export function LanguageSwitcher({
  currentLocale,
  currentPathname = '/',
}: LanguageSwitcherProps) {
  const { locale: contextLocale } = useI18n()
  const activeLocale = currentLocale ?? contextLocale

  const handleChange = (newLocale: Locale) => {
    if (newLocale === activeLocale) return
    // Use hard navigation (not router.push) because locale changes require
    // the server layout to re-render with a new dictionary. Soft navigation
    // reuses the cached RSC payload since middleware rewrites all locales
    // to the same underlying route.
    const dest = localePath(stripLocalePrefix(currentPathname), newLocale)
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
