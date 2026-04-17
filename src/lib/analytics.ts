import 'server-only'

import { sql } from '@payloadcms/db-postgres'

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
  truncated: boolean
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
  truncated: boolean
}

type DrizzleExecutor = {
  execute: (query: unknown) => Promise<unknown>
}

// Period helpers

function getPeriodDays(period: AnalyticsPeriod): number {
  return period === '7d' ? 7 : period === '90d' ? 90 : 30
}

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date()
  const days = getPeriodDays(period)
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

function getRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[]
  if (!result || typeof result !== 'object') return []

  const rows = (result as { rows?: unknown }).rows
  return Array.isArray(rows) ? rows as Record<string, unknown>[] : []
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback
}

function getDrizzleExecutor(payload: unknown): DrizzleExecutor | null {
  const drizzle = (payload as { db?: { drizzle?: unknown } })?.db?.drizzle
  if (!drizzle || typeof drizzle !== 'object') return null

  const execute = (drizzle as { execute?: unknown }).execute
  if (typeof execute !== 'function') return null

  return { execute: execute.bind(drizzle) as DrizzleExecutor['execute'] }
}

async function fetchAggregatedPageViews(
  since: Date,
  period: AnalyticsPeriod,
): Promise<AnalyticsSummary | null> {
  const payload = await getPayloadClient()
  const drizzle = getDrizzleExecutor(payload)

  if (!drizzle) return null

  const sinceIso = since.toISOString()
  const [
    totalResult,
    dailyUniqueResult,
    topPagesResult,
    referrersResult,
    devicesResult,
    languagesResult,
    dailyViewsResult,
  ] = await Promise.all([
    drizzle.execute(sql`
      SELECT COUNT(*)::bigint AS total_views
      FROM "page_views"
      WHERE "created_at" >= ${sinceIso}::timestamptz
    `),
    drizzle.execute(sql`
      SELECT COALESCE(AVG(unique_visitors), 0)::float AS daily_unique_visitors
      FROM (
        SELECT date_trunc('day', "created_at" AT TIME ZONE 'UTC') AS day,
               COUNT(DISTINCT "visitor_hash")::bigint AS unique_visitors
        FROM "page_views"
        WHERE "created_at" >= ${sinceIso}::timestamptz
          AND "visitor_hash" IS NOT NULL
        GROUP BY 1
      ) daily
    `),
    drizzle.execute(sql`
      SELECT COALESCE(NULLIF("path", ''), '/') AS path,
             COUNT(*)::bigint AS views,
             COUNT(DISTINCT "visitor_hash")::bigint AS unique
      FROM "page_views"
      WHERE "created_at" >= ${sinceIso}::timestamptz
      GROUP BY 1
      ORDER BY views DESC
      LIMIT 10
    `),
    drizzle.execute(sql`
      SELECT COALESCE(NULLIF("referrer", ''), 'direct') AS source,
             COUNT(*)::bigint AS sessions
      FROM "page_views"
      WHERE "created_at" >= ${sinceIso}::timestamptz
      GROUP BY 1
      ORDER BY sessions DESC
      LIMIT 5
    `),
    drizzle.execute(sql`
      SELECT COALESCE("device"::text, 'desktop') AS label,
             COUNT(*)::bigint AS count
      FROM "page_views"
      WHERE "created_at" >= ${sinceIso}::timestamptz
      GROUP BY 1
      ORDER BY count DESC
    `),
    drizzle.execute(sql`
      SELECT COALESCE(NULLIF("language", ''), 'unknown') AS label,
             COUNT(*)::bigint AS count
      FROM "page_views"
      WHERE "created_at" >= ${sinceIso}::timestamptz
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 5
    `),
    drizzle.execute(sql`
      SELECT to_char(date_trunc('day', "created_at" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
             COUNT(*)::bigint AS views
      FROM "page_views"
      WHERE "created_at" >= ${sinceIso}::timestamptz
      GROUP BY 1
      ORDER BY 1
    `),
  ])

  const totalViews = asNumber(getRows(totalResult)[0]?.total_views)
  const dailyUniqueVisitors = asNumber(
    getRows(dailyUniqueResult)[0]?.daily_unique_visitors,
  )

  const topPages = getRows(topPagesResult).map((row) => ({
    path: asString(row.path, '/'),
    views: asNumber(row.views),
    unique: asNumber(row.unique),
  }))

  const referrers = getRows(referrersResult).map((row) => {
    const sessions = asNumber(row.sessions)

    return {
      source: formatReferrer(asString(row.source, 'direct')),
      sessions,
      percentage: totalViews > 0 ? Math.round((sessions / totalViews) * 100) : 0,
    }
  })

  const devices = getRows(devicesResult).map((row) => {
    const label = asString(row.label, 'desktop')
    const count = asNumber(row.count)

    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
    }
  })

  const languages = getRows(languagesResult).map((row) => {
    const count = asNumber(row.count)

    return {
      label: mapLanguageLabel(asString(row.label, 'unknown')),
      value: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
    }
  })

  const dailyCounts = new Map(
    getRows(dailyViewsResult).map((row) => [
      asString(row.date, ''),
      asNumber(row.views),
    ]),
  )
  const days = getPeriodDays(period)
  const dailyViews: { date: string; views: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dailyViews.push({ date: key, views: dailyCounts.get(key) ?? 0 })
  }

  return {
    dailyUniqueVisitors,
    pageViews: totalViews,
    topPages,
    referrers,
    devices,
    languages,
    dailyViews,
    truncated: false,
  }
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
    truncated: false,
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
    stats.truncated = true
  }

  return stats
}

// Main query

export async function getAnalytics(period: AnalyticsPeriod = '30d'): Promise<AnalyticsSummary> {
  try {
    const since = getPeriodStart(period)
    const aggregated = await fetchAggregatedPageViews(since, period)
    if (aggregated) return aggregated

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
    const days = getPeriodDays(period)
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
      truncated: stats.truncated,
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
      truncated: false,
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
