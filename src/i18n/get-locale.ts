import { cookies, headers } from 'next/headers'

import { defaultLocale, isValidLocale, type Locale } from './config'

/**
 * Read the user's locale. Checks the x-locale header (set by middleware from
 * the URL segment) first, then falls back to the locale cookie, then the
 * default locale.
 */
export async function getLocale(): Promise<Locale> {
  // Prefer URL-segment locale set by middleware
  const headerStore = await headers()
  const headerLocale = headerStore.get('x-locale') ?? ''
  if (isValidLocale(headerLocale)) return headerLocale

  // Fallback to cookie (e.g. for non-middleware paths)
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('locale')?.value ?? ''
  return isValidLocale(cookieLocale) ? cookieLocale : defaultLocale
}
