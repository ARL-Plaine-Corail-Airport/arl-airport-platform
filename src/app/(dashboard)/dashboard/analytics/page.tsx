import Link from 'next/link'

import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getAnalytics, type AnalyticsPeriod } from '@/lib/analytics'

export const metadata = { title: 'Analytics' }
export const dynamic = 'force-dynamic'

function BarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  await requireDashboardSectionAccess('analytics')
  const params = await searchParams
  const period = (['7d', '30d', '90d'].includes(params.period ?? '') ? params.period : '30d') as AnalyticsPeriod
  const data = await getAnalytics(period)

  const maxDailyViews = Math.max(...data.dailyViews.map((d) => d.views), 1)
  const hasData = data.pageViews > 0

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            Website traffic overview — Airport of Rodrigues public site
          </p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['7d', '30d', '90d'] as AnalyticsPeriod[]).map((p) => (
              <Link
                key={p}
                href={`/dashboard/analytics?period=${p}`}
                className={`btn btn-sm ${p === period ? 'btn-primary' : 'btn-outline'}`}
              >
                {PERIOD_LABELS[p]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="info-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <strong>No analytics data yet.</strong>{' '}
            Page views are tracked automatically when visitors browse the public site.
            Data will appear here once the first visits are recorded.
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <UsersIcon />
          </div>
          <div className="stat-info">
            <div className="stat-label">Avg. Daily Unique Visitors</div>
            <div className="stat-value">
              {data.dailyUniqueVisitors.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
            </div>
            <div className="stat-change">{PERIOD_LABELS[period]}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <BarIcon />
          </div>
          <div className="stat-info">
            <div className="stat-label">Page Views</div>
            <div className="stat-value">{data.pageViews.toLocaleString()}</div>
            <div className="stat-change">{PERIOD_LABELS[period]}</div>
          </div>
        </div>
      </div>

      {/* Daily views chart */}
      {data.dailyViews.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Traffic Overview ({PERIOD_LABELS[period]})</h2>
          </div>
          <div className="card-body">
            <div style={{
              height: 180,
              background: 'hsl(var(--muted-bg))',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'flex-end',
              gap: period === '90d' ? 1 : 4,
              padding: '20px 16px 0',
              overflow: 'hidden',
            }}>
              {data.dailyViews.map((d, i) => {
                const pct = maxDailyViews > 0 ? (d.views / maxDailyViews) * 100 : 0
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.views} views`}
                    style={{
                      flex: 1,
                      height: `${Math.max(pct, 2)}%`,
                      background: d.views > 0
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--info) / 0.2)',
                      borderRadius: '3px 3px 0 0',
                      minWidth: 2,
                      cursor: 'default',
                    }}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="text-xs text-muted">{data.dailyViews[0]?.date ?? ''}</span>
              <span className="text-xs text-muted">
                {data.dailyViews[Math.floor(data.dailyViews.length / 2)]?.date ?? ''}
              </span>
              <span className="text-xs text-muted">
                {data.dailyViews[data.dailyViews.length - 1]?.date ?? ''}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Top pages table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Pages</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Page</th>
                  <th style={{ textAlign: 'right' }}>Views</th>
                  <th style={{ textAlign: 'right' }}>Unique</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>
                      No page views recorded yet
                    </td>
                  </tr>
                )}
                {data.topPages.map((page) => (
                  <tr key={page.path}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{page.path}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {page.views.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {page.unique.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic sources */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Traffic Sources</h2>
          </div>
          <div className="card-body">
            {data.referrers.length === 0 && (
              <p className="text-muted text-small" style={{ textAlign: 'center', padding: 24 }}>
                No referrer data yet
              </p>
            )}
            {data.referrers.map((ref) => (
              <div key={ref.source} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{ref.source}</span>
                  <span className="text-xs text-muted">{ref.sessions.toLocaleString()} views</span>
                </div>
                <div style={{
                  height: 8,
                  background: 'hsl(var(--muted-bg))',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${ref.percentage}%`,
                    background: 'hsl(var(--primary))',
                    borderRadius: 4,
                  }} />
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 2, textAlign: 'right' }}>
                  {ref.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device & language breakdowns */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Devices</h2>
          </div>
          <div className="card-body">
            {data.devices.length === 0 && (
              <p className="text-muted text-small" style={{ textAlign: 'center', padding: 24 }}>
                No device data yet
              </p>
            )}
            {data.devices.map((d) => (
              <div key={d.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid hsl(var(--border))',
              }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{d.label}</span>
                <span className="badge badge-info">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Languages</h2>
          </div>
          <div className="card-body">
            {data.languages.length === 0 && (
              <p className="text-muted text-small" style={{ textAlign: 'center', padding: 24 }}>
                No language data yet
              </p>
            )}
            {data.languages.map((lang) => (
              <div key={lang.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid hsl(var(--border))',
              }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{lang.label}</span>
                <span className="text-xs text-muted">{lang.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
