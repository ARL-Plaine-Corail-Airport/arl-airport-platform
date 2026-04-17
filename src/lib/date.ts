import { logger } from '@/lib/logger'

const LOCALE_MAP: Record<string, string> = {
  en: 'en-MU',
  fr: 'fr-MU',
  mfe: 'fr-MU',
}

const SITE_TIME_ZONE = 'Indian/Mauritius'
const EMPTY_VALUE = '\u2014'
const DEFAULT_LOCALE = 'en-MU'

function parseDate(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildMauritiusDayRange(
  year: string,
  month: string,
  day: string,
): { startOfDay: string; endOfDay: string } {
  const startISO = `${year}-${month}-${day}T00:00:00+04:00`
  const endISO = `${year}-${month}-${day}T23:59:59.999+04:00`

  return {
    startOfDay: new Date(startISO).toISOString(),
    endOfDay: new Date(endISO).toISOString(),
  }
}

export function formatDate(value?: string | null): string {
  const date = parseDate(value)
  if (!date) return EMPTY_VALUE

  try {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: SITE_TIME_ZONE,
    })
  } catch {
    logger.warn(`Date format failed: ${value}`, 'date')
    return EMPTY_VALUE
  }
}

/**
 * Returns the start and end of "today" in Mauritius time as UTC ISO strings.
 * Ensures flight queries use the Mauritius calendar day regardless of the
 * server's local timezone.
 */
export function getMauritiusDayRange(): { startOfDay: string; endOfDay: string } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (year && month && day) {
    return buildMauritiusDayRange(year, month, day)
  }

  const fallbackDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const fallbackMatch = fallbackDate.match(/(\d{4})-(\d{2})-(\d{2})/)

  if (fallbackMatch) {
    return buildMauritiusDayRange(
      fallbackMatch[1],
      fallbackMatch[2],
      fallbackMatch[3],
    )
  }

  const mauritiusNow = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const [isoYear, isoMonth, isoDay] = mauritiusNow.toISOString().slice(0, 10).split('-')
  return buildMauritiusDayRange(isoYear, isoMonth, isoDay)
}

export const formatDateTime = (value?: string | null, locale = 'en') => {
  const date = parseDate(value)
  if (!date) return EMPTY_VALUE

  try {
    return new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? DEFAULT_LOCALE, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: SITE_TIME_ZONE,
    }).format(date)
  } catch {
    logger.warn(`DateTime format failed: ${value}`, 'date')
    return EMPTY_VALUE
  }
}
