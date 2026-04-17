import { describe, expect, it } from 'vitest'

import { localePath, stripLocalePrefix } from '@/i18n/path'

/**
 * Tests that the language switcher URL construction preserves
 * query params and hash fragments. The component builds the URL as:
 *   localePath(stripLocalePrefix(pathname), newLocale) + search + hash
 */

describe('language switcher URL construction', () => {
  it('produces a clean locale path without query/hash', () => {
    const dest = localePath(stripLocalePrefix('/en/notices'), 'fr')
    expect(dest).toBe('/fr/notices')
  })

  it('preserves query string when appended', () => {
    const pathname = '/en/notices'
    const search = '?category=operational&page=2'
    const hash = ''

    const dest = localePath(stripLocalePrefix(pathname), 'fr') + search + hash
    expect(dest).toBe('/fr/notices?category=operational&page=2')
  })

  it('preserves hash fragment when appended', () => {
    const pathname = '/fr/airport-project'
    const search = ''
    const hash = '#documents'

    const dest = localePath(stripLocalePrefix(pathname), 'en') + search + hash
    expect(dest).toBe('/en/airport-project#documents')
  })

  it('preserves both query string and hash', () => {
    const pathname = '/mfe/news-events'
    const search = '?type=event'
    const hash = '#upcoming'

    const dest = localePath(stripLocalePrefix(pathname), 'en') + search + hash
    expect(dest).toBe('/en/news-events?type=event#upcoming')
  })

  it('handles root path with query params', () => {
    const pathname = '/en'
    const search = '?ref=banner'
    const hash = ''

    const dest = localePath(stripLocalePrefix(pathname), 'fr') + search + hash
    expect(dest).toBe('/fr?ref=banner')
  })
})
