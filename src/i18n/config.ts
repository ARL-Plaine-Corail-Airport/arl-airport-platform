export const locales = ['en', 'fr', 'mfe'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeLabels: Record<Locale, string> = {
  en:  'English',
  fr:  'Français',
  mfe: 'Kreol',
}

/** ISO flag codes for display (optional UI use) */
export const localeFlags: Record<Locale, string> = {
  en:  '🇬🇧',
  fr:  '🇫🇷',
  mfe: '🇲🇺',
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}
