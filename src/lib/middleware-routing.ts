import { defaultLocale, isValidLocale, type Locale } from '@/i18n/config'

export type MiddlewarePathInfo = {
  locale: Locale | null
  normalizedPathname: string
}

function normalizePathname(pathname: string): string {
  if (!pathname) return '/'
  if (pathname === '/') return '/'

  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return normalized.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
}

export function getMiddlewarePathInfo(pathname: string): MiddlewarePathInfo {
  const normalizedPathname = normalizePathname(pathname)
  const segments = normalizedPathname.split('/').filter(Boolean)
  const maybeLocale = segments[0]

  if (maybeLocale && isValidLocale(maybeLocale)) {
    const rest = segments.slice(1)

    return {
      locale: maybeLocale,
      normalizedPathname: rest.length > 0 ? `/${rest.join('/')}` : '/',
    }
  }

  return { locale: null, normalizedPathname }
}

export function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function getLegacyVipRedirectPath(
  pathname: string,
  locale: Locale | null,
): string | null {
  if (pathname !== '/airport-vip-lounge') return null

  return `/${locale ?? defaultLocale}/vip-lounge`
}
