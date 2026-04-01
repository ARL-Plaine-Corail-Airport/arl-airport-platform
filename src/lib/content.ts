import { cache } from 'react'

import { defaultHomePage, defaultSiteSettings, emptySectionsPage } from '@/lib/defaults'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'

// All content functions accept an optional `locale` parameter.
// When provided, Payload returns field values for that locale.
type Loc = 'en' | 'fr' | 'mfe' | 'all'

export const getSiteSettings = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'site-settings', depth: 1, locale: locale as Loc })) || defaultSiteSettings
  } catch (error) {
    logger.error('Failed to fetch site settings', error, 'content')
    return defaultSiteSettings
  }
})

export const getHomePage = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'home-page', depth: 1, locale: locale as Loc })) || defaultHomePage
  } catch (error) {
    logger.error('Failed to fetch home page', error, 'content')
    return defaultHomePage
  }
})

export const getPassengerGuide = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'passenger-guide', depth: 1, locale: locale as Loc })) || emptySectionsPage
  } catch (error) {
    logger.error('Failed to fetch passenger guide', error, 'content')
    return emptySectionsPage
  }
})

export const getTransportParking = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'transport-parking', depth: 1, locale: locale as Loc })) || emptySectionsPage
  } catch (error) {
    logger.error('Failed to fetch transport parking', error, 'content')
    return emptySectionsPage
  }
})

export const getAccessibilityInfo = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'accessibility-info', depth: 1, locale: locale as Loc })) || emptySectionsPage
  } catch (error) {
    logger.error('Failed to fetch accessibility info', error, 'content')
    return emptySectionsPage
  }
})

export const getAirportMap = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    return (
      (await payload.findGlobal({ slug: 'airport-map', depth: 1, locale: locale as Loc })) || {
        introTitle: 'Airport map',
        introSummary: 'Map data will appear here once editorial content is configured.',
        mapEmbedURL: null,
        points: [],
      }
    )
  } catch (error) {
    logger.error('Failed to fetch airport map', error, 'content')
    return {
      introTitle: 'Airport map',
      introSummary: 'Map data will appear here once editorial content is configured.',
      mapEmbedURL: null,
      points: [],
    }
  }
})

export const getContactInfo = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    return (
      (await payload.findGlobal({ slug: 'contact-info', depth: 1, locale: locale as Loc })) || {
        helpDeskTitle: 'Contact and help desk',
        helpDeskSummary: 'Official support details will appear here.',
        cards: [],
      }
    )
  } catch (error) {
    logger.error('Failed to fetch contact info', error, 'content')
    return {
      helpDeskTitle: 'Contact and help desk',
      helpDeskSummary: 'Official support details will appear here.',
      cards: [],
    }
  }
})

export const getLatestNotices = cache(async (limit = 6, locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'notices',
      depth: 1,
      limit,
      locale: locale as Loc,
      sort: '-publishedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    // Filter out notices missing a title in the current locale
    return result.docs.filter((doc: any) => !!doc.title)
  } catch (error) {
    logger.error('Failed to fetch latest notices', error, 'content')
    return []
  }
})

export const getPromotedEmergencyNotice = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'notices',
      depth: 1,
      limit: 1,
      locale: locale as Loc,
      sort: '-publishedAt',
      where: {
        and: [
          { status: { equals: 'published' } },
          { urgent: { equals: true } },
          { promoteToBanner: { equals: true } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logger.error('Failed to fetch emergency notice', error, 'content')
    return null
  }
})

export const getNoticeBySlug = cache(async (slug: string, locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'notices',
      depth: 1,
      limit: 1,
      locale: locale as Loc,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logger.error(`Failed to fetch notice: ${slug}`, error, 'content')
    return null
  }
})

export const getFAQs = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'faqs',
      depth: 1,
      limit: 100,
      locale: locale as Loc,
      sort: 'order',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    return result.docs
  } catch (error) {
    logger.error('Failed to fetch FAQs', error, 'content')
    return []
  }
})

export const getPageBySlug = cache(async (slug: string, locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'pages',
      depth: 1,
      limit: 1,
      locale: locale as Loc,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logger.error(`Failed to fetch page: ${slug}`, error, 'content')
    return null
  }
})

export const getVIPLounge = cache(async (locale?: string) => {
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
    return (await payload.findGlobal({ slug: 'vip-lounge', depth: 1, locale: locale as Loc })) || fallback
  } catch (error) {
    logger.error('Failed to fetch VIP lounge', error, 'content')
    return fallback
  }
})

export const getUsefulLinks = cache(async (locale?: string) => {
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
    return (await payload.findGlobal({ slug: 'useful-links', depth: 1, locale: locale as Loc })) || fallback
  } catch (error) {
    logger.error('Failed to fetch useful links', error, 'content')
    return fallback
  }
})

export const getEmergencyServices = cache(async (locale?: string) => {
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
    return (await payload.findGlobal({ slug: 'emergency-services', depth: 1, locale: locale as Loc })) || fallback
  } catch (error) {
    logger.error('Failed to fetch emergency services', error, 'content')
    return fallback
  }
})

export const getLegalPages = cache(async (locale?: string) => {
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
    return (await payload.findGlobal({ slug: 'legal-pages', depth: 1, locale: locale as Loc })) || fallback
  } catch (error) {
    logger.error('Failed to fetch legal pages', error, 'content')
    return fallback
  }
})

export const getNewsEvents = cache(async (limit = 24, locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news-events',
      depth: 1,
      limit,
      locale: locale as Loc,
      sort: '-publishedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    return result.docs
  } catch (error) {
    logger.error('Failed to fetch news events', error, 'content')
    return []
  }
})

export const getNewsEventBySlug = cache(async (slug: string, locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news-events',
      depth: 1,
      limit: 1,
      locale: locale as Loc,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logger.error(`Failed to fetch news event: ${slug}`, error, 'content')
    return null
  }
})

export const getAirportProjectItems = cache(async (limit = 24, locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'airport-project',
      depth: 1,
      limit,
      locale: locale as Loc,
      sort: '-publishedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    return result.docs
  } catch (error) {
    logger.error('Failed to fetch airport project items', error, 'content')
    return []
  }
})

export const getAirportProjectBySlug = cache(async (slug: string, locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'airport-project',
      depth: 1,
      limit: 1,
      locale: locale as Loc,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
    })

    return result.docs[0] || null
  } catch (error) {
    logger.error(`Failed to fetch airport project item: ${slug}`, error, 'content')
    return null
  }
})

export const getPublishedPages = cache(async (locale?: string) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 200,
      locale: locale as Loc,
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    return result.docs
  } catch (error) {
    logger.error('Failed to fetch published pages', error, 'content')
    return []
  }
})
