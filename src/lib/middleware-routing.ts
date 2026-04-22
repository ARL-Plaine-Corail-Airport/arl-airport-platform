import { defaultLocale, isValidLocale, type Locale } from '@/i18n/config'
import { logger } from '@/lib/logger'

export type MiddlewarePathInfo = {
  locale: Locale | null
  normalizedPathname: string
}

const MAX_PATHNAME_LENGTH = 2048

function normalizePathname(pathname: string, host?: string | null): string {
  if (!pathname) return '/'
  if (pathname === '/') return '/'
  if (pathname.length > MAX_PATHNAME_LENGTH) {
    logger.warn(
      `Truncated overlong pathname host=${host ?? 'unknown'} pathLength=${pathname.length}`,
      'middleware-routing',
    )
    return '/'
  }

  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return normalized.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
}

export function getMiddlewarePathInfo(
  pathname: string,
  host?: string | null,
): MiddlewarePathInfo {
  const normalizedPathname = normalizePathname(pathname, host)
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
