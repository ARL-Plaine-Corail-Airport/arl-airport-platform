import React from 'react'
import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'

export const metadata = { title: 'Audit Log' }

type ActivityItem = {
  id: string
  type: 'notice' | 'page' | 'user'
  title: string
  action: 'create' | 'update' | 'publish' | 'delete'
  updatedAt: string
  href?: string
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '—' }
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(dateStr)
  } catch { return '—' }
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function ActivityDot({ type }: { type: 'create' | 'update' | 'publish' | 'delete' }) {
  const icons: Record<string, React.ReactNode> = {
    create: (
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    update: (
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    delete: (
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
    publish: (
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  }
  return <div className={`activity-dot ${type}`}>{icons[type]}</div>
}

function getNoticeAction(notice: any): 'create' | 'update' | 'publish' {
  if (notice.status === 'published') return 'publish'
  const created = new Date(notice.createdAt).getTime()
  const updated = new Date(notice.updatedAt).getTime()
  if (updated - created < 5000) return 'create'
  return 'update'
}

function getPageAction(page: any): 'create' | 'update' | 'publish' {
  const created = new Date(page.createdAt).getTime()
  const updated = new Date(page.updatedAt).getTime()
  if (updated - created < 5000) return 'create'
  if (page.status === 'published' || page._status === 'published') return 'publish'
  return 'update'
}

export default async function AuditPage() {
  await requireDashboardSectionAccess('audit')
  const payload = await getPayloadClient()

  let recentNotices: any[] = []
  let recentPages: any[] = []

  try {
    const r = await payload.find({
      collection: 'notices', depth: 0, limit: 10, sort: '-updatedAt', overrideAccess: true,
    })
    recentNotices = r.docs as any[]
  } catch (error) { logger.error('Failed to fetch notices for audit', error, 'dashboard') }

  try {
    const r = await payload.find({
      collection: 'pages', depth: 0, limit: 10, sort: '-updatedAt', overrideAccess: true,
    })
    recentPages = r.docs as any[]
  } catch (error) { logger.error('Failed to fetch pages for audit', error, 'dashboard') }

  // Combine into activity timeline
  const activities: ActivityItem[] = [
    ...recentNotices.map((n): ActivityItem => ({
      id: `notice-${n.id}`,
      type: 'notice',
      title: n.title,
      action: getNoticeAction(n),
      updatedAt: n.updatedAt,
      href: `/admin/collections/notices/${n.id}`,
    })),
    ...recentPages.map((p): ActivityItem => ({
      id: `page-${p.id}`,
      type: 'page',
      title: p.title,
      action: getPageAction(p),
      updatedAt: p.updatedAt,
      href: `/admin/collections/pages/${p.id}`,
    })),
  ]

  // Sort by updatedAt desc
  activities.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const typeLabels: Record<ActivityItem['type'], string> = {
    notice: 'Notice',
    page: 'Page',
    user: 'User',
  }

  const actionLabels: Record<ActivityItem['action'], string> = {
    create: 'created',
    update: 'updated',
    publish: 'published',
    delete: 'deleted',
  }

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">
            Recent content changes and administrative actions
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="warning-banner">
        <InfoIcon />
        <div>
          <strong>Limited audit data available.</strong>{' '}
          Full audit logging (user attribution, IP addresses, field-level diffs) requires
          an audit-log plugin or a custom implementation. The log below is derived from
          recent <code>updatedAt</code> timestamps across collections and does not capture
          who made each change. To enable full audit logging, integrate a dedicated
          audit-log solution.
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            type="search"
            placeholder="Search audit events..."
            disabled
          />
        </div>
        <select className="filter-select" disabled>
          <option>All Action Types</option>
          <option>Create</option>
          <option>Update</option>
          <option>Publish</option>
          <option>Delete</option>
        </select>
        <select className="filter-select" disabled>
          <option>All Collections</option>
          <option>Notices</option>
          <option>Pages</option>
          <option>Users</option>
        </select>
      </div>

      <div className="grid-2">
        {/* Activity timeline */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h2 className="card-title">Recent Activity Timeline</h2>
            <span className="badge badge-muted">{activities.length} events</span>
          </div>
          <div className="card-body" style={{ padding: '4px 18px' }}>
            {activities.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <h3>No activity to show</h3>
                <p>Create some content to see the audit timeline.</p>
              </div>
            ) : (
              <div className="activity-list">
                {activities.map((item) => (
                  <div key={item.id} className="activity-item">
                    <ActivityDot type={item.action} />
                    <div className="activity-body">
                      <div className="activity-text">
                        <span className="badge badge-muted" style={{ marginRight: 6, fontSize: 10 }}>
                          {typeLabels[item.type]}
                        </span>
                        {item.href ? (
                          <Link
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 500 }}
                          >
                            &ldquo;{item.title}&rdquo;
                          </Link>
                        ) : (
                          <strong>&ldquo;{item.title}&rdquo;</strong>
                        )}{' '}
                        was{' '}
                        <span style={{
                          fontWeight: 600,
                          color: item.action === 'publish' ? 'hsl(var(--success))' :
                                 item.action === 'delete' ? 'hsl(var(--danger))' :
                                 item.action === 'create' ? 'hsl(var(--info))' :
                                 'hsl(var(--foreground))',
                        }}>
                          {actionLabels[item.action]}
                        </span>
                      </div>
                      <div className="activity-time" title={formatDate(item.updatedAt)}>
                        {timeAgo(item.updatedAt)} · {formatDate(item.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {activities.length > 0 && (
            <div className="card-footer">
              Showing {activities.length} most recent events across notices and pages.
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-3" style={{ marginTop: 8 }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'hsl(var(--info))' }}>
              {activities.filter((a) => a.action === 'create').length}
            </div>
            <div className="stat-label">Created</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'hsl(var(--warning))' }}>
              {activities.filter((a) => a.action === 'update').length}
            </div>
            <div className="stat-label">Updated</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: 'hsl(var(--success))' }}>
              {activities.filter((a) => a.action === 'publish').length}
            </div>
            <div className="stat-label">Published</div>
          </div>
        </div>
      </div>

      {/* Links to full collections */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2 className="card-title">Browse Collections in Payload Admin</h2>
        </div>
        <div className="card-body">
          <p className="text-muted text-small" style={{ marginBottom: 16 }}>
            For a more detailed view of individual record histories, open the collections
            directly in Payload admin where you can see full document versions.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Notices', href: '/admin/collections/notices' },
              { label: 'Pages', href: '/admin/collections/pages' },
              { label: 'FAQs', href: '/admin/collections/faqs' },
              { label: 'Airlines', href: '/admin/collections/airlines' },
              { label: 'Users', href: '/admin/collections/users' },
              { label: 'Media', href: '/admin/collections/media' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn btn-outline btn-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
