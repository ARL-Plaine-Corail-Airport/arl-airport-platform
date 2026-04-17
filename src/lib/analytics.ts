import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Period helpers ─────────────────────────────────────────────────────────

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date()
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

// ─── Paginated fetch ────────────────────────────────────────────────────────

const PAGE_SIZE = 1000
const MAX_PAGES = 50

async function fetchAllPageViews(since: Date): Promise<any[]> {
  const payload = await getPayloadClient()
  const docs: any[] = []
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

    docs.push(...result.docs)
    hasMore = result.hasNextPage
    page++
  }

  if (page > MAX_PAGES) {
    logger.warn(`fetchAllPageViews hit MAX_PAGES cap (${MAX_PAGES})`, 'analytics')
  }

  return docs
}

// ─── Main query ─────────────────────────────────────────────────────────────

export async function getAnalytics(period: AnalyticsPeriod = '30d'): Promise<AnalyticsSummary> {
  try {
    const since = getPeriodStart(period)
    const docs = await fetchAllPageViews(since)
    const totalViews = docs.length

    // ── Daily unique visitors ────────────────────────────────────────
    // The visitor hash is IP+date, so the same person on different days
    // produces different hashes. We count distinct hashes per day and
    // average across the days that recorded traffic.
    const dailyHashSets = new Map<string, Set<string>>()
    for (const doc of docs) {
      const date = (doc.createdAt as string)?.slice(0, 10)
      if (!date || !doc.visitorHash) continue
      if (!dailyHashSets.has(date)) dailyHashSets.set(date, new Set())
      const hashes = dailyHashSets.get(date)
      if (!hashes) continue
      hashes.add(doc.visitorHash)
    }
    let totalDailyUniques = 0
    for (const hashes of dailyHashSets.values()) {
      totalDailyUniques += hashes.size
    }
    const dailyUniqueVisitors =
      dailyHashSets.size > 0 ? totalDailyUniques / dailyHashSets.size : 0

    // ── Top pages ─────────────────────────────────────────────────────
    const pageCounts = new Map<string, { views: number; visitors: Set<string> }>()
    for (const doc of docs) {
      const path = doc.path ?? '/'
      if (!pageCounts.has(path)) {
        pageCounts.set(path, { views: 0, visitors: new Set() })
      }
      const entry = pageCounts.get(path)
      if (!entry) continue
      entry.views++
      if (doc.visitorHash) entry.visitors.add(doc.visitorHash)
    }

    const topPages = Array.from(pageCounts.entries())
      .map(([path, data]) => ({
        path,
        views: data.views,
        unique: data.visitors.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // ── Referrers ─────────────────────────────────────────────────────
    const refCounts = new Map<string, number>()
    for (const doc of docs) {
      const ref = doc.referrer ?? 'direct'
      refCounts.set(ref, (refCounts.get(ref) ?? 0) + 1)
    }

    const referrers = Array.from(refCounts.entries())
      .map(([source, sessions]) => ({
        source: formatReferrer(source),
        sessions,
        percentage: totalViews > 0 ? Math.round((sessions / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)

    // ── Devices ───────────────────────────────────────────────────────
    const deviceCounts = new Map<string, number>()
    for (const doc of docs) {
      const device = doc.device ?? 'desktop'
      deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1)
    }

    const devices = Array.from(deviceCounts.entries())
      .map(([label, count]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    // ── Languages ─────────────────────────────────────────────────────
    const langCounts = new Map<string, number>()
    for (const doc of docs) {
      const lang = mapLanguageLabel(doc.language ?? 'unknown')
      langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1)
    }

    const languages = Array.from(langCounts.entries())
      .map(([label, count]) => ({
        label,
        value: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // ── Daily views (for chart) ───────────────────────────────────────
    const dayCounts = new Map<string, number>()
    for (const doc of docs) {
      const date = (doc.createdAt as string)?.slice(0, 10)
      if (date) dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1)
    }

    // Fill in zero-days
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const dailyViews: { date: string; views: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      dailyViews.push({ date: key, views: dayCounts.get(key) ?? 0 })
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

// ─── Helpers ────────────────────────────────────────────────────────────────

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
