import { defaultLocale, isValidLocale, locales, type Locale } from './config'

function normalizePath(path: string): string {
  if (!path) return '/'

  const [pathname, query = ''] = path.split('?')
  const trimmed = pathname.trim() || '/'
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/')
  const normalizedPathname = collapsed === '/' ? '/' : collapsed.replace(/\/$/, '')

  return query ? `${normalizedPathname}?${query}` : normalizedPathname
}

export function stripLocalePrefix(path: string): string {
  const normalized = normalizePath(path)
  const [pathname, query = ''] = normalized.split('?')
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length > 0 && isValidLocale(segments[0])) {
    const strippedPathname =
      segments.length === 1 ? '/' : `/${segments.slice(1).join('/')}`
    return query ? `${strippedPathname}?${query}` : strippedPathname
  }

  return normalized
}

export function localePath(path: string, locale: Locale = defaultLocale): string {
  const stripped = stripLocalePrefix(path)
  const [pathname, query = ''] = stripped.split('?')
  const normalizedPathname = pathname === '/' ? '' : pathname
  const localizedPath = `/${locale}${normalizedPathname}` || `/${locale}`

  return query ? `${localizedPath}?${query}` : localizedPath
}

export function isLocalePrefixedPath(path: string): boolean {
  const normalized = normalizePath(path)
  const firstSegment = normalized.split('/').filter(Boolean)[0]
  return Boolean(firstSegment && locales.includes(firstSegment as Locale))
}
