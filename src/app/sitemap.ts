import type { MetadataRoute } from 'next'

import { defaultLocale, locales, type Locale } from '@/i18n/config'
import { localePath } from '@/i18n/path'
import { logger } from '@/lib/logger'
import {
  getAirportProjectItems,
  getLatestNotices,
  getNewsEvents,
  getPublishedPages,
} from '@/lib/content'
import { env } from '@/lib/env'

type SitemapEntry = MetadataRoute.Sitemap[number]

const excludedGenericPageSlugs = new Set(['airport-vip-lounge'])

const flightRoutes = ['/arrivals', '/departures', '/flight-status'] as const
const contentListingRoutes = ['/news-events', '/notices', '/airport-project', '/career'] as const
const informationalRoutes = [
  '/passenger-guide',
  '/transport-parking',
  '/accessibility',
  '/airport-map',
  '/faq',
  '/contact',
  '/duty-free',
  '/vip-lounge',
  '/emergency-services',
  '/amenities',
  '/useful-links',
] as const
const legalRoutes = ['/disclaimer', '/privacy', '/terms-conditions'] as const

function absoluteLocalizedUrl(path: string, locale: Locale): string {
  return new URL(localePath(path, locale), env.siteURL).toString()
}

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function addEntry(
  entries: Map<string, SitemapEntry>,
  url: string,
  entry: Omit<SitemapEntry, 'url'>,
) {
  if (!entries.has(url)) {
    entries.set(url, { url, ...entry })
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const localizedContent = await Promise.all(
      locales.map(async (locale) => {
        try {
          return {
            locale,
            pages: await getPublishedPages(locale),
            newsEvents: await getNewsEvents(200, locale),
            notices: await getLatestNotices(200, locale),
            projectItems: await getAirportProjectItems(200, locale),
          }
        } catch {
          return { locale, pages: [], newsEvents: [], notices: [], projectItems: [] }
        }
      }),
    )

    const entries = new Map<string, SitemapEntry>()

    for (const locale of locales) {
      addEntry(entries, absoluteLocalizedUrl('/', locale), {
        changeFrequency: 'weekly',
        priority: locale === defaultLocale ? 1 : 0.9,
      })

      for (const path of flightRoutes) {
        addEntry(entries, absoluteLocalizedUrl(path, locale), {
          changeFrequency: 'daily',
          priority: 0.9,
        })
      }

      for (const path of contentListingRoutes) {
        addEntry(entries, absoluteLocalizedUrl(path, locale), {
          changeFrequency: 'daily',
          priority: 0.8,
        })
      }

      for (const path of informationalRoutes) {
        addEntry(entries, absoluteLocalizedUrl(path, locale), {
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }

      for (const path of legalRoutes) {
        addEntry(entries, absoluteLocalizedUrl(path, locale), {
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }

    for (const { locale, pages, newsEvents, notices, projectItems } of localizedContent) {
      for (const item of newsEvents) {
        if (!item?.slug) continue
        addEntry(entries, absoluteLocalizedUrl(`/news-events/${item.slug}`, locale), {
          lastModified: toDate(item.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }

      for (const item of notices) {
        if (!item?.slug) continue
        addEntry(entries, absoluteLocalizedUrl(`/notices/${item.slug}`, locale), {
          lastModified: toDate(item.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }

      for (const item of projectItems) {
        if (!item?.slug) continue
        addEntry(entries, absoluteLocalizedUrl(`/airport-project/${item.slug}`, locale), {
          lastModified: toDate(item.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }

      for (const page of pages) {
        if (!page?.slug || excludedGenericPageSlugs.has(page.slug)) continue
        addEntry(entries, absoluteLocalizedUrl(`/${page.slug}`, locale), {
          lastModified: toDate(page.updatedAt),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }

    return Array.from(entries.values())
  } catch (error) {
    logger.error('Failed to generate sitemap', error, 'sitemap')
    return [
      {
        url: absoluteLocalizedUrl('/', defaultLocale),
        changeFrequency: 'weekly',
        priority: 1,
      },
    ]
  }
}
