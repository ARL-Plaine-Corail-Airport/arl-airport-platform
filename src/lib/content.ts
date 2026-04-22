import 'server-only'

import { cache } from 'react'
import type { Where } from 'payload'

import { isValidLocale, type Locale } from '@/i18n/config'
import { isBuildTimeDbDisabledError } from '@/lib/build-db'
import { defaultHomePage, defaultSiteSettings, emptySectionsPage } from '@/lib/defaults'
import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { normalizeSiteSettings } from '@/lib/site-settings'
import { getSignedURLs } from '@/lib/storage/supabase-client'
import type { Notice } from '@/payload-types'

// All content functions accept an optional `locale` parameter.
// When provided, Payload returns field values for that locale.
type Loc = Locale | 'all'

function getPayloadLocale(locale?: string): Loc | undefined {
  if (locale === undefined) return undefined
  if (locale === 'all' || isValidLocale(locale)) return locale
  throw new Error(`Invalid content locale: ${locale}`)
}

function logContentError(message: string, error: unknown) {
  if (isBuildTimeDbDisabledError(error)) return
  logger.error(message, error, 'content')
}

function logTruncationWarning(collection: string, result: { totalDocs?: number; docs: Array<unknown> }) {
  if (typeof result.totalDocs !== 'number') return

  if (result.totalDocs > result.docs.length) {
    logger.warn(`Truncated ${result.totalDocs - result.docs.length} items from ${collection}`, 'content')
  }
}

function getPublishedNoticeFilters(nowIso: string): Where[] {
  return [
    { status: { equals: 'published' } },
    {
      or: [
        { expiresAt: { exists: false } },
        { expiresAt: { greater_than: nowIso } },
      ],
    },
  ]
}

function getDocumentStoragePath(file: {
  prefix?: string | null
  filename?: string | null
} | null | undefined): string | null {
  if (!file?.filename) return null
  return file.prefix ? `${file.prefix}/${file.filename}` : file.filename
}

async function signDocumentAttachmentURLs<T extends {
  attachments?: Array<{ file?: unknown } | null> | null
}>(items: T[]): Promise<T[]> {
  const storagePaths = Array.from(new Set(
    items.flatMap((item) =>
      (item.attachments ?? []).flatMap((attachment) => {
        if (!attachment?.file || typeof attachment.file !== 'object') return []
        const path = getDocumentStoragePath(attachment.file as {
          prefix?: string | null
          filename?: string | null
        })
        return path ? [path] : []
      }),
    ),
  ))

  if (storagePaths.length === 0) return items

  try {
    const signedURLs = await getSignedURLs(serverEnv.documentsBucket, storagePaths)

    return items.map((item) => ({
      ...item,
      attachments: item.attachments?.map((attachment) => {
        if (!attachment?.file || typeof attachment.file !== 'object') return attachment

        const path = getDocumentStoragePath(attachment.file as {
          prefix?: string | null
          filename?: string | null
        })

        if (!path) return attachment

        const signedURL = signedURLs[path]
        if (!signedURL) return attachment

        return {
          ...attachment,
          file: {
            ...attachment.file,
            url: signedURL,
          },
        }
      }) ?? item.attachments,
    }))
  } catch (error) {
    logContentError('Failed to sign document attachments', error)
    return items
  }
}

export const getSiteSettings = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const settings =
      (await payload.findGlobal({ slug: 'site-settings', depth: 1, locale: payloadLocale })) ||
      defaultSiteSettings

    return normalizeSiteSettings(settings)
  } catch (error) {
    logContentError('Failed to fetch site settings', error)
    return defaultSiteSettings
  }
})

export const getHomePage = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'home-page', depth: 1, locale: payloadLocale })) || defaultHomePage
  } catch (error) {
    logContentError('Failed to fetch home page', error)
    return defaultHomePage
  }
})

export const getPassengerGuide = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'passenger-guide', depth: 1, locale: payloadLocale })) || emptySectionsPage
  } catch (error) {
    logContentError('Failed to fetch passenger guide', error)
    return emptySectionsPage
  }
})

export const getTransportParking = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'transport-parking', depth: 1, locale: payloadLocale })) || emptySectionsPage
  } catch (error) {
    logContentError('Failed to fetch transport parking', error)
    return emptySectionsPage
  }
})

export const getAccessibilityInfo = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'accessibility-info', depth: 1, locale: payloadLocale })) || emptySectionsPage
  } catch (error) {
    logContentError('Failed to fetch accessibility info', error)
    return emptySectionsPage
  }
})

export const getAirportMap = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    return (
      (await payload.findGlobal({ slug: 'airport-map', depth: 1, locale: payloadLocale })) || {
        introTitle: 'Airport map',
        introSummary: 'Map data will appear here once editorial content is configured.',
        mapEmbedURL: null,
        points: [],
      }
    )
  } catch (error) {
    logContentError('Failed to fetch airport map', error)
    return {
      introTitle: 'Airport map',
      introSummary: 'Map data will appear here once editorial content is configured.',
      mapEmbedURL: null,
      points: [],
    }
  }
})

export const getContactInfo = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    return (
      (await payload.findGlobal({ slug: 'contact-info', depth: 1, locale: payloadLocale })) || {
        helpDeskTitle: 'Contact and help desk',
        helpDeskSummary: 'Official support details will appear here.',
        cards: [],
      }
    )
  } catch (error) {
    logContentError('Failed to fetch contact info', error)
    return {
      helpDeskTitle: 'Contact and help desk',
      helpDeskSummary: 'Official support details will appear here.',
      cards: [],
    }
  }
})

export const getLatestNotices = cache(async (limit = 6, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const nowIso = new Date().toISOString()
    const result = await payload.find({
      collection: 'notices',
      depth: 1,
      limit,
      locale: payloadLocale,
      sort: '-publishedAt',
      where: {
        and: getPublishedNoticeFilters(nowIso),
      },
    })

    logTruncationWarning('notices', result)

    // Filter out notices missing a title in the current locale
    return (result.docs as Notice[]).filter((doc) => !!doc.title)
  } catch (error) {
    logContentError('Failed to fetch latest notices', error)
    return []
  }
})

export const getPromotedEmergencyNotice = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const nowIso = new Date().toISOString()
    const result = await payload.find({
      collection: 'notices',
      depth: 1,
      limit: 1,
      locale: payloadLocale,
      sort: '-publishedAt',
      where: {
        and: [
          ...getPublishedNoticeFilters(nowIso),
          { urgent: { equals: true } },
          { promoteToBanner: { equals: true } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logContentError('Failed to fetch emergency notice', error)
    return null
  }
})

export const getNoticeBySlug = cache(async (slug: string, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const nowIso = new Date().toISOString()
    const result = await payload.find({
      collection: 'notices',
      depth: 1,
      limit: 1,
      locale: payloadLocale,
      where: {
        and: [
          { slug: { equals: slug } },
          ...getPublishedNoticeFilters(nowIso),
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logContentError(`Failed to fetch notice: ${slug}`, error)
    return null
  }
})

export const getFAQs = cache(async (limit = 100, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'faqs',
      depth: 1,
      limit,
      locale: payloadLocale,
      sort: 'order',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    logTruncationWarning('faqs', result)

    return result.docs
  } catch (error) {
    logContentError('Failed to fetch FAQs', error)
    return []
  }
})

export const getPageBySlug = cache(async (slug: string, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'pages',
      depth: 1,
      limit: 1,
      locale: payloadLocale,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logContentError(`Failed to fetch page: ${slug}`, error)
    return null
  }
})

export const getVIPLounge = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  const fallback = {
    pageTitle: 'VIP Lounge',
    introduction: null as string | null,
    amenities: [] as Array<{ item: string }>,
    eligibility: null as string | null,
    bookingInformation: null as string | null,
    operatingHours: null as string | null,
    contactPhone: null as string | null,
    contactEmail: null as string | null,
    loungeImages: [] as Array<{ image: unknown; id?: string | null }>,
  }
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'vip-lounge', depth: 1, locale: payloadLocale })) || fallback
  } catch (error) {
    logContentError('Failed to fetch VIP lounge', error)
    return fallback
  }
})

export const getUsefulLinks = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  const fallback = {
    pageTitle: 'Useful Links',
    introduction: null as string | null,
    linkGroups: [] as Array<{
      groupName: string
      links: Array<{
        label: string
        url: string
        description?: string | null
        openInNewTab?: boolean | null
      }>
    }>,
  }

  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'useful-links', depth: 1, locale: payloadLocale })) || fallback
  } catch (error) {
    logContentError('Failed to fetch useful links', error)
    return fallback
  }
})

export const getEmergencyServices = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  const fallback = {
    pageTitle: 'Emergency Services',
    introduction:
      'Official emergency contact information will appear here once verified and published.',
    primaryEmergencyNumber: '999',
    serviceContacts: [] as Array<{
      serviceName: string
      phone: string
      description?: string | null
      available24h?: boolean | null
    }>,
    medicalFacilities: null as string | null,
    evacuationProcedures: null as string | null,
    lastVerifiedDate: null as string | null,
    verifiedBy: null as string | null,
  }

  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'emergency-services', depth: 1, locale: payloadLocale })) || fallback
  } catch (error) {
    logContentError('Failed to fetch emergency services', error)
    return fallback
  }
})

export const getLegalPages = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  const fallback = {
    disclaimer: {
      title: 'Disclaimer',
      content: 'Legal disclaimer content will appear here once published.',
      lastUpdated: null as string | null,
    },
    termsOfUse: {
      title: 'Terms & Conditions',
      content: 'Terms and conditions will appear here once published.',
      lastUpdated: null as string | null,
      effectiveDate: null as string | null,
    },
    privacyPolicy: {
      title: 'Privacy Policy',
      content: 'Privacy policy content will appear here once published.',
      lastUpdated: null as string | null,
      dataControllerName: null as string | null,
      dataControllerEmail: null as string | null,
    },
    cookiePolicy: {
      title: 'Cookie Policy',
      content: null as string | null,
      lastUpdated: null as string | null,
    },
  }

  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'legal-pages', depth: 1, locale: payloadLocale })) || fallback
  } catch (error) {
    logContentError('Failed to fetch legal pages', error)
    return fallback
  }
})

export const getNewsEvents = cache(async (limit = 24, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news-events',
      depth: 1,
      limit,
      locale: payloadLocale,
      sort: '-publishedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    logTruncationWarning('news-events', result)

    return result.docs
  } catch (error) {
    logContentError('Failed to fetch news events', error)
    return []
  }
})

export const getNewsEventBySlug = cache(async (slug: string, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news-events',
      depth: 1,
      limit: 1,
      locale: payloadLocale,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logContentError(`Failed to fetch news event: ${slug}`, error)
    return null
  }
})

export const getNewsEventsWithSignedAttachments = cache(async (limit = 24, locale?: string) => {
  const items = await getNewsEvents(limit, locale)
  return signDocumentAttachmentURLs(items)
})

export const getNewsEventBySlugWithSignedAttachments = cache(async (slug: string, locale?: string) => {
  const item = await getNewsEventBySlug(slug, locale)
  if (!item) return null

  const [signedItem] = await signDocumentAttachmentURLs([item])
  return signedItem ?? null
})

export const getAirportProjectItems = cache(async (limit = 24, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'airport-project',
      depth: 1,
      limit,
      locale: payloadLocale,
      sort: '-publishedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    logTruncationWarning('airport-project', result)

    return result.docs
  } catch (error) {
    logContentError('Failed to fetch airport project items', error)
    return []
  }
})

export const getAirportProjectBySlug = cache(async (slug: string, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'airport-project',
      depth: 1,
      limit: 1,
      locale: payloadLocale,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logContentError(`Failed to fetch airport project item: ${slug}`, error)
    return null
  }
})

export const getAirportProjectItemsWithSignedAttachments = cache(async (limit = 24, locale?: string) => {
  const items = await getAirportProjectItems(limit, locale)
  return signDocumentAttachmentURLs(items)
})

export const getAirportProjectBySlugWithSignedAttachments = cache(async (slug: string, locale?: string) => {
  const item = await getAirportProjectBySlug(slug, locale)
  if (!item) return null

  const [signed] = await signDocumentAttachmentURLs([item])
  return signed ?? null
})

export const getCareerItems = cache(async (limit = 24, locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'careers',
      depth: 1,
      limit,
      locale: payloadLocale,
      sort: '-publishedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    logTruncationWarning('careers', result)

    return result.docs
  } catch (error) {
    logContentError('Failed to fetch career notices', error)
    return []
  }
})

export const getCareerItemsWithSignedAttachments = cache(async (limit = 24, locale?: string) => {
  const items = await getCareerItems(limit, locale)
  return signDocumentAttachmentURLs(items)
})

export const getPublishedPages = cache(async (locale?: string) => {
  const payloadLocale = getPayloadLocale(locale)
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 200,
      locale: payloadLocale,
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    logTruncationWarning('pages', result)

    return result.docs
  } catch (error) {
    logContentError('Failed to fetch published pages', error)
    return []
  }
})
