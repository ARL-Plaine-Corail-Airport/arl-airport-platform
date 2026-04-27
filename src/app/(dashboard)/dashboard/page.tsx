import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { cachedFetch } from '@/lib/cache'
import { getFlightBoards } from '@/lib/integrations/flights'
import { logger } from '@/lib/logger'
import { formatDate } from '@/lib/date'
import type { Notice } from '@/payload-types'

export const metadata = { title: 'Dashboard' }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  operational: 'Operational',
  passenger_info: 'Passenger Info',
  regulation: 'Regulation',
  fee: 'Fee',
  emergency: 'Emergency',
  corporate: 'Corporate',
}

const CATEGORY_BADGE: Record<string, string> = {
  operational: 'badge-info',
  passenger_info: 'badge-primary',
  regulation: 'badge-primary',
  fee: 'badge-warning',
  emergency: 'badge-danger',
  corporate: 'badge-muted',
}

const STATUS_BADGE: Record<string, string> = {
  published: 'badge-success',
  approved: 'badge-success',
  in_review: 'badge-warning',
  draft: 'badge-warning',
  expired: 'badge-muted',
  archived: 'badge-muted',
}

const unavailableValue = '\u2014'
const DASHBOARD_DATA_TIMEOUT_MS = 8000

function withDashboardDataTimeout<T>(label: string, promise: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${DASHBOARD_DATA_TIMEOUT_MS}ms`))
    }, DASHBOARD_DATA_TIMEOUT_MS)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout)
  })
}

function countDelayed(records: Array<{ remarks?: string | null }>): number {
  return records.filter((record) => {
    const remarks = record?.remarks
    return typeof remarks === 'string' && remarks.toLowerCase().includes('delay')
  }).length
}

function formatStatusLabel(status?: string | null): string {
  return status ? status.replace('_', ' ') : '—'
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function IconPublish() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconFlight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2l-.4.9 6.8 2.7-1.7 3.5-3.2 1.5.2.8 4.7-1.2 2.7 6.8.9-.4z" />
    </svg>
  )
}

function IconPages() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// Stat card icons
function FlightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2l-.4.9 6.8 2.7-1.7 3.5-3.2 1.5.2.8 4.7-1.2 2.7 6.8.9-.4z" />
    </svg>
  )
}

function DelayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function NoticeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function DegradedDataBanner({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null

  return (
    <div
      role="status"
      style={{
        border: '1px solid #f59e0b',
        background: '#fffbeb',
        color: '#92400e',
        borderRadius: 8,
        padding: '0.875rem 1rem',
        marginBottom: '1rem',
        fontSize: '0.875rem',
      }}
    >
      <strong>Dashboard data is degraded.</strong>{' '}
      Could not load {sources.join(', ')}. Unavailable values are shown as {unavailableValue}.
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DashboardOverviewPage() {
  await requireDashboardSectionAccess('overview')
  const payload = await getPayloadClient()

  // Fetch data with fallbacks
  let recentNotices: Notice[] = []
  let totalNotices: number | null = null
  let activeNotices: number | null = null
  let emergencyBanners: number | null = null
  let userCount: number | null = null

  let arrivalsBoard = { configured: false, records: [] as Array<{ remarks?: string | null }> }
  let departuresBoard = { configured: false, records: [] as Array<{ remarks?: string | null }> }

  const [
    recentNoticesResult,
    totalNoticesResult,
    activeNoticesResult,
    emergencyBannersResult,
    usersResult,
    boardsResult,
  ] = await Promise.allSettled([
    withDashboardDataTimeout(
      'recent notices',
      payload.find({
        collection: 'notices',
        depth: 0,
        limit: 5,
        sort: '-updatedAt',
        overrideAccess: true,
      }),
    ),
    withDashboardDataTimeout(
      'total notices',
      payload.count({
        collection: 'notices',
        overrideAccess: true,
      }),
    ),
    withDashboardDataTimeout(
      'active notices',
      payload.count({
        collection: 'notices',
        overrideAccess: true,
        where: {
          or: [
            { status: { equals: 'published' } },
            { status: { equals: 'approved' } },
          ],
        },
      }),
    ),
    withDashboardDataTimeout(
      'emergency banners',
      payload.count({
        collection: 'notices',
        overrideAccess: true,
        where: {
          and: [
            { urgent: { equals: true } },
            { promoteToBanner: { equals: true } },
            { status: { equals: 'published' } },
          ],
        },
      }),
    ),
    withDashboardDataTimeout(
      'admin users',
      payload.count({
        collection: 'users',
        overrideAccess: true,
      }),
    ),
    withDashboardDataTimeout(
      'flight boards',
      cachedFetch('flights:rotations', 2600, getFlightBoards, {
        shouldCache: (data) => !data.degraded,
      }),
    ),
  ])

  const degradedSources: string[] = []

  if (recentNoticesResult.status === 'fulfilled') {
    recentNotices = recentNoticesResult.value.docs
  } else {
    degradedSources.push('recent notices')
    logger.error('Failed to fetch recent notices', recentNoticesResult.reason, 'dashboard')
  }

  if (totalNoticesResult.status === 'fulfilled') {
    totalNotices = totalNoticesResult.value.totalDocs
  } else {
    degradedSources.push('total notices')
    logger.error('Failed to fetch total notices count', totalNoticesResult.reason, 'dashboard')
  }

  if (activeNoticesResult.status === 'fulfilled') {
    activeNotices = activeNoticesResult.value.totalDocs
  } else {
    degradedSources.push('active notices')
    logger.error('Failed to fetch active notices count', activeNoticesResult.reason, 'dashboard')
  }

  if (emergencyBannersResult.status === 'fulfilled') {
    emergencyBanners = emergencyBannersResult.value.totalDocs
  } else {
    degradedSources.push('emergency banners')
    logger.error(
      'Failed to fetch emergency banner count',
      emergencyBannersResult.reason,
      'dashboard',
    )
  }

  if (usersResult.status === 'fulfilled') {
    userCount = usersResult.value.totalDocs
  } else {
    degradedSources.push('admin users')
    logger.error('Failed to fetch users count', usersResult.reason, 'dashboard')
  }

  if (boardsResult.status === 'fulfilled') {
    arrivalsBoard = boardsResult.value.arrivals
    departuresBoard = boardsResult.value.departures
  } else {
    degradedSources.push('flight boards')
    logger.error('Failed to fetch flight boards', boardsResult.reason, 'dashboard')
  }

  // Compute stats
  const totalFlights = arrivalsBoard.records.length + departuresBoard.records.length
  const delayedCount = countDelayed(arrivalsBoard.records) + countDelayed(departuresBoard.records)
  const flightsUnavailable = boardsResult.status === 'rejected'

  return (
    <main className="page-content">
      {/* Page title row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here is the Airport of Rodrigues overview</p>
        </div>
        <div className="page-actions">
          <Link href="/admin/collections/notices/create" className="btn btn-primary">
            <IconPlus />
            New Notice
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <Link href="/dashboard/notices" className="quick-action">
          <IconPublish />
          Publish Notice
        </Link>
        <Link href="/dashboard/emergency" className="quick-action">
          <IconAlert />
          Emergency Banner
        </Link>
        <Link href="/dashboard/flights" className="quick-action">
          <IconFlight />
          Update Flights
        </Link>
        <Link href="/dashboard/pages-cms" className="quick-action">
          <IconPages />
          Edit Pages
        </Link>
      </div>

      <DegradedDataBanner sources={degradedSources} />

      {/* Stats grid */}
      <div className="stats-grid">
        {/* Today's Flights */}
        <div className="stat-card">
          <div className="stat-icon blue">
            <FlightIcon />
          </div>
          <div className="stat-info">
            <div className="stat-label">Today&apos;s Flights</div>
            <div className="stat-value">{flightsUnavailable ? unavailableValue : totalFlights}</div>
            <div className="stat-change">
              {flightsUnavailable
                ? 'Unavailable'
                : arrivalsBoard.configured
                ? `${arrivalsBoard.records.length} arr · ${departuresBoard.records.length} dep`
                : 'Feed not configured'}
            </div>
          </div>
        </div>

        {/* Delayed */}
        <div className="stat-card">
          <div className="stat-icon orange">
            <DelayIcon />
          </div>
          <div className="stat-info">
            <div className="stat-label">Delayed</div>
            <div className="stat-value">{flightsUnavailable ? unavailableValue : delayedCount}</div>
            <div className="stat-change">
              {flightsUnavailable
                ? 'Unavailable'
                : arrivalsBoard.configured
                ? 'From live feed'
                : 'Feed not configured'}
            </div>
          </div>
        </div>

        {/* Active Notices */}
        <div className="stat-card">
          <div className="stat-icon green">
            <NoticeIcon />
          </div>
          <div className="stat-info">
            <div className="stat-label">Active Notices</div>
            <div className="stat-value">{activeNotices ?? unavailableValue}</div>
            <div className="stat-change">
              {totalNotices === null ? 'Total unavailable' : `${totalNotices} total notices`}
            </div>
          </div>
        </div>

        {/* Admin Users */}
        <div className="stat-card">
          <div className="stat-icon teal">
            <UserIcon />
          </div>
          <div className="stat-info">
            <div className="stat-label">Admin Users</div>
            <div className="stat-value">{userCount ?? unavailableValue}</div>
            <div className="stat-change">{userCount === null ? 'Unavailable' : 'All roles'}</div>
          </div>
        </div>

        {/* Emergency Banners */}
        <div className="stat-card">
          <div className="stat-icon red">
            <AlertIcon />
          </div>
          <div className="stat-info">
            <div className="stat-label">Emergency Banners</div>
            <div className="stat-value">{emergencyBanners ?? unavailableValue}</div>
            <div className="stat-change">
              {emergencyBanners === null
                ? 'Unavailable'
                : emergencyBanners === 0
                ? 'All clear'
                : 'Active alert'}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column section */}
      <div className="grid-2">
        {/* Recent Notices */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Notices</h2>
            <Link href="/dashboard/notices" className="btn btn-outline btn-sm">
              View all
            </Link>
          </div>
          <div className="table-wrap">
            {recentNotices.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <p>No notices yet.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNotices.map((notice) => (
                    <tr key={notice.id}>
                      <td>
                        <Link
                          href={`/admin/collections/notices/${notice.id}`}
                          style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {notice.title}
                        </Link>
                        {notice.urgent && (
                          <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                            Urgent
                          </span>
                        )}
                      </td>
                      <td>
                        {notice.category ? (
                          <span className={`badge ${CATEGORY_BADGE[notice.category] ?? 'badge-muted'}`}>
                            {CATEGORY_LABELS[notice.category] ?? notice.category}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[notice.status] ?? 'badge-muted'}`}>
                          {formatStatusLabel(notice.status)}
                        </span>
                      </td>
                      <td className="text-muted text-xs">{formatDate(notice.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
