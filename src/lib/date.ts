const LOCALE_MAP: Record<string, string> = {
  en: 'en-MU',
  fr: 'fr-MU',
  mfe: 'fr-MU',
}

export const formatDateTime = (value?: string | null, locale = 'en') => {
  if (!value) return '—'

  return new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? 'en-MU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
