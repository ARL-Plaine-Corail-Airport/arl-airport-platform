import { describe, expect, it } from 'vitest'

import {
  getLegacyVipRedirectPath,
  getMiddlewarePathInfo,
  matchesPathPrefix,
} from '@/lib/middleware-routing'

describe('middleware routing helpers', () => {
  it('normalizes locale-prefixed reserved paths before routing', () => {
    expect(getMiddlewarePathInfo('/en/api/track')).toEqual({
      locale: 'en',
      normalizedPathname: '/api/track',
    })
    expect(getMiddlewarePathInfo('/fr/dashboard')).toEqual({
      locale: 'fr',
      normalizedPathname: '/dashboard',
    })
    expect(getMiddlewarePathInfo('/mfe/admin/login')).toEqual({
      locale: 'mfe',
      normalizedPathname: '/admin/login',
    })
  })

  it('does not treat normal public locale pages as reserved', () => {
    const pagePath = getMiddlewarePathInfo('/en/contact')

    expect(pagePath).toEqual({
      locale: 'en',
      normalizedPathname: '/contact',
    })
    expect(matchesPathPrefix(pagePath.normalizedPathname, '/api')).toBe(false)
    expect(matchesPathPrefix(pagePath.normalizedPathname, '/dashboard')).toBe(false)
    expect(matchesPathPrefix(pagePath.normalizedPathname, '/admin')).toBe(false)
  })

  it('maps the legacy VIP lounge slug to the canonical localized route', () => {
    expect(getLegacyVipRedirectPath('/airport-vip-lounge', null)).toBe('/en/vip-lounge')
    expect(getLegacyVipRedirectPath('/airport-vip-lounge', 'fr')).toBe('/fr/vip-lounge')
    expect(getLegacyVipRedirectPath('/vip-lounge', 'en')).toBeNull()
  })
})
