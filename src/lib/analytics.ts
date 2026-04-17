import 'server-only'

import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'

// Types

export type AnalyticsPeriod = '7d' | '30d' | '90d'

export type AnalyticsSummary = {
  dailyUniqueVisitors: number
  pageViews: number
  topPages: { path: string; views: number; unique: number }[]
  referrers: { source: string; sessions: number; percentage: number }[]
  devices: { label: string; value: number }[]
  languages: { label: string; value: number }[]
  dailyViews: { date: string; views: number }[]
}

type PageViewDoc = {
  createdAt?: string | null
  visitorHash?: string | null
  path?: string | null
  referrer?: string | null
  device?: string | null
  language?: string | null
}

type PageViewStats = {
  totalViews: number
  dailyHashSets: Map<string, Set<string>>
  pageCounts: Map<string, { views: number; visitors: Set<string> }>
  refCounts: Map<string, number>
  deviceCounts: Map<string, number>
  langCounts: Map<string, number>
  dayCounts: Map<string, number>
}

// Period helpers

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date()
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

// Paginated fetch

const PAGE_SIZE = 1000
const MAX_PAGES = 50

async function fetchAllPageViews(since: Date): Promise<PageViewStats> {
  const payload = await getPayloadClient()
  const stats: PageViewStats = {
    totalViews: 0,
    dailyHashSets: new Map(),
    pageCounts: new Map(),
    refCounts: new Map(),
    deviceCounts: new Map(),
    langCounts: new Map(),
    dayCounts: new Map(),
  }

  let page = 1
  let hasMore = true

  while (hasMore && page <= MAX_PAGES) {
    const result = await payload.find({
      collection: 'page-views',
      limit: PAGE_SIZE,
      page,
      where: {
        createdAt: { greater_than_equal: since.toISOString() },
      },
      sort: 'createdAt',
    })

    for (const doc of result.docs as PageViewDoc[]) {
      stats.totalViews++

      const date = doc.createdAt?.slice(0, 10)
      if (date) {
        stats.dayCounts.set(date, (stats.dayCounts.get(date) ?? 0) + 1)

        if (doc.visitorHash) {
          if (!stats.dailyHashSets.has(date)) stats.dailyHashSets.set(date, new Set())
          const hashes = stats.dailyHashSets.get(date)
          if (hashes) hashes.add(doc.visitorHash)
        }
      }

      const path = doc.path ?? '/'
      if (!stats.pageCounts.has(path)) {
        stats.pageCounts.set(path, { views: 0, visitors: new Set() })
      }
      const pageEntry = stats.pageCounts.get(path)
      if (pageEntry) {
        pageEntry.views++
        if (doc.visitorHash) pageEntry.visitors.add(doc.visitorHash)
      }

      const ref = doc.referrer ?? 'direct'
      stats.refCounts.set(ref, (stats.refCounts.get(ref) ?? 0) + 1)

      const device = doc.device ?? 'desktop'
      stats.deviceCounts.set(device, (stats.deviceCounts.get(device) ?? 0) + 1)

      const lang = mapLanguageLabel(doc.language ?? 'unknown')
      stats.langCounts.set(lang, (stats.langCounts.get(lang) ?? 0) + 1)
    }

    hasMore = result.hasNextPage
    page++
  }

  if (hasMore) {
    logger.warn(`fetchAllPageViews hit MAX_PAGES cap (${MAX_PAGES})`, 'analytics')
  }

  return stats
}

// Main query

export async function getAnalytics(period: AnalyticsPeriod = '30d'): Promise<AnalyticsSummary> {
  try {
    const since = getPeriodStart(period)
    const stats = await fetchAllPageViews(since)
    const totalViews = stats.totalViews

    // Daily unique visitors
    // The visitor hash is IP+date, so the same person on different days
    // produces different hashes. We count distinct hashes per day and
    // average across the days that recorded traffic.
    let totalDailyUniques = 0
    for (const hashes of stats.dailyHashSets.values()) {
      totalDailyUniques += hashes.size
    }
    const dailyUniqueVisitors =
      stats.dailyHashSets.size > 0 ? totalDailyUniques / stats.dailyHashSets.size : 0

    // Top pages
    const topPages = Array.from(stats.pageCounts.entries())
      .map(([path, data]) => ({
        path,
        views: data.views,
        unique: data.visitors.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Referrers
    const referrers = Array.from(stats.refCounts.entries())
      .map(([source, sessions]) => ({
        source: formatReferrer(source),
        sessions,
        percentage: totalViews > 0 ? Math.round((sessions / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)

    // Devices
    const devices = Array.from(stats.deviceCounts.entries())
      .map(([label, count]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    // Languages
    const languages = Array.from(stats.langCounts.entries())
      .map(([label, count]) => ({
        label,
        value: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Daily views (for chart)
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const dailyViews: { date: string; views: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      dailyViews.push({ date: key, views: stats.dayCounts.get(key) ?? 0 })
    }

    return {
      dailyUniqueVisitors,
      pageViews: totalViews,
      topPages,
      referrers,
      devices,
      languages,
      dailyViews,
    }
  } catch (error) {
    logger.error('Failed to fetch analytics', error, 'analytics')
    return {
      dailyUniqueVisitors: 0,
      pageViews: 0,
      topPages: [],
      referrers: [],
      devices: [],
      languages: [],
      dailyViews: [],
    }
  }
}

// Helpers

function formatReferrer(source: string): string {
  if (source === 'direct') return 'Direct / Bookmark'
  if (source.includes('google')) return 'Google Search'
  if (source.includes('bing')) return 'Bing Search'
  if (source.includes('facebook') || source.includes('fb.com')) return 'Facebook'
  if (source.includes('twitter') || source.includes('t.co')) return 'X (Twitter)'
  if (source.includes('instagram')) return 'Instagram'
  return source
}

function mapLanguageLabel(code: string): string {
  const map: Record<string, string> = {
    en: 'English',
    fr: 'French',
    mfe: 'Kreol Morisien',
    de: 'German',
    es: 'Spanish',
    zh: 'Chinese',
    unknown: 'Unknown',
  }
  return map[code] ?? code.toUpperCase()
}
