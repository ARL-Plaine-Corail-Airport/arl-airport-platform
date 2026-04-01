import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'

export const metadata = { title: 'Notices' }

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
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

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; tab?: string }>
}) {
  await requireDashboardSectionAccess('notices')
  const params = await searchParams
  const activeTab = params.tab ?? 'all'
  const categoryFilter = params.category ?? ''

  const payload = await getPayloadClient()
  let allNotices: any[] = []

  try {
    const result = await payload.find({
      collection: 'notices',
      depth: 0,
      limit: 200,
      sort: '-updatedAt',
      overrideAccess: true,
    })
    allNotices = result.docs as any[]
  } catch (error) { logger.error('Failed to fetch notices', error, 'dashboard') }

  // Filter by tab
  let filtered = allNotices
  if (activeTab === 'published') filtered = allNotices.filter((n) => n.status === 'published')
  else if (activeTab === 'drafts') filtered = allNotices.filter((n) => n.status === 'draft')
  else if (activeTab === 'in_review') filtered = allNotices.filter((n) => n.status === 'in_review')
  else if (activeTab === 'pinned') filtered = allNotices.filter((n) => n.pinned)

  // Filter by category
  if (categoryFilter) {
    filtered = filtered.filter((n) => n.category === categoryFilter)
  }

  const countAll = allNotices.length
  const countPublished = allNotices.filter((n) => n.status === 'published').length
  const countDrafts = allNotices.filter((n) => n.status === 'draft').length
  const countReview = allNotices.filter((n) => n.status === 'in_review').length
  const countPinned = allNotices.filter((n) => n.pinned).length

  function tabHref(tab: string) {
    const q = new URLSearchParams({ tab })
    if (categoryFilter) q.set('category', categoryFilter)
    return `/dashboard/notices?${q.toString()}`
  }

  return (
    <main className="page-content">
      {/* Title row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Notices &amp; Communiqués</h1>
          <p className="page-subtitle">Manage all airport notices, alerts, and communiqués</p>
        </div>
        <div className="page-actions">
          <Link href="/admin/collections/notices/create" className="btn btn-primary">
            <PlusIcon />
            New Notice
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <Link href={tabHref('all')} className={`tab${activeTab === 'all' ? ' active' : ''}`}>
          All <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>{countAll}</span>
        </Link>
        <Link href={tabHref('published')} className={`tab${activeTab === 'published' ? ' active' : ''}`}>
          Published <span className="badge badge-success" style={{ fontSize: 10, padding: '1px 6px' }}>{countPublished}</span>
        </Link>
        <Link href={tabHref('drafts')} className={`tab${activeTab === 'drafts' ? ' active' : ''}`}>
          Drafts <span className="badge badge-warning" style={{ fontSize: 10, padding: '1px 6px' }}>{countDrafts}</span>
        </Link>
        <Link href={tabHref('in_review')} className={`tab${activeTab === 'in_review' ? ' active' : ''}`}>
          In Review <span className="badge badge-warning" style={{ fontSize: 10, padding: '1px 6px' }}>{countReview}</span>
        </Link>
        <Link href={tabHref('pinned')} className={`tab${activeTab === 'pinned' ? ' active' : ''}`}>
          Pinned <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>{countPinned}</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            type="search"
            placeholder="Search notices..."
            disabled
            title="Use Payload admin for full-text search"
          />
        </div>
        <form method="GET" action="/dashboard/notices" style={{ display: 'contents' }}>
          <input type="hidden" name="tab" value={activeTab} />
          <select
            className="filter-select"
            name="category"
            defaultValue={categoryFilter}
          >
            <option value="">All Categories</option>
            <option value="operational">Operational</option>
            <option value="passenger_info">Passenger Info</option>
            <option value="regulation">Regulation</option>
            <option value="fee">Fee</option>
            <option value="emergency">Emergency</option>
            <option value="corporate">Corporate</option>
          </select>
          <button type="submit" className="btn btn-outline btn-sm">Filter</button>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {filtered.length} notice{filtered.length !== 1 ? 's' : ''} shown
          </h2>
          <Link href="/admin/collections/notices" className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">
            Open in Payload
          </Link>
        </div>
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <h3>No notices found</h3>
              <p>
                {activeTab !== 'all' || categoryFilter
                  ? 'Try adjusting the filters above.'
                  : 'Create your first notice to get started.'}
              </p>
              <Link href="/admin/collections/notices/create" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <PlusIcon /> New Notice
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Flags</th>
                  <th>Published</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{notice.title}</div>
                      {notice.attachments && Array.isArray(notice.attachments) && notice.attachments.length > 0 && (
                        <div className="text-muted text-xs" style={{ marginTop: 2 }}>
                          PDF attached
                        </div>
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
                        {notice.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {notice.urgent && (
                          <span className="badge badge-danger">Urgent</span>
                        )}
                        {notice.pinned && (
                          <span className="badge badge-info">Pinned</span>
                        )}
                        {(notice as any).promoteToBanner && (
                          <span className="badge badge-warning">Banner</span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs">{formatDate(notice.publishedAt)}</td>
                    <td className="text-xs">
                      {notice.expiresAt ? (
                        <span style={{ color: new Date(notice.expiresAt) < new Date() ? 'hsl(0 72% 45%)' : 'inherit' }}>
                          {formatDate(notice.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          href={`/admin/collections/notices/${notice.id}`}
                          className="btn btn-outline btn-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <EditIcon /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="card-footer">
            Showing {filtered.length} of {allNotices.length} total notices.
          </div>
        )}
      </div>
    </main>
  )
}
