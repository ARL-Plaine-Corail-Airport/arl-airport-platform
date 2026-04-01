import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'

export const metadata = { title: 'Pages' }

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
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

function ViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export default async function PagesCmsPage() {
  await requireDashboardSectionAccess('pages')
  const payload = await getPayloadClient()
  let pages: any[] = []

  try {
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 100,
      sort: 'title',
      overrideAccess: true,
    })
    pages = result.docs as any[]
  } catch (error) { logger.error('Failed to fetch CMS pages', error, 'dashboard') }

  const publishedCount = pages.filter((p) => p.status === 'published' || p._status === 'published').length
  const draftCount = pages.filter((p) => p.status === 'draft' || p._status === 'draft').length

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Pages</h1>
          <p className="page-subtitle">Manage all CMS-driven pages for the Airport of Rodrigues website</p>
        </div>
        <div className="page-actions">
          <Link href="/admin/collections/pages/create" className="btn btn-primary">
            <PlusIcon />
            New Page
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Pages</div>
            <div className="stat-value">{pages.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Published</div>
            <div className="stat-value" style={{ color: 'hsl(var(--success))' }}>{publishedCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Drafts</div>
            <div className="stat-value" style={{ color: 'hsl(var(--warning))' }}>{draftCount}</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            type="search"
            placeholder="Search pages..."
            disabled
          />
        </div>
        <select className="filter-select" disabled>
          <option>All Statuses</option>
          <option>Published</option>
          <option>Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Pages ({pages.length})</h2>
          <Link
            href="/admin/collections/pages"
            className="btn btn-outline btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Payload
          </Link>
        </div>
        <div className="table-wrap">
          {pages.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <h3>No pages yet</h3>
              <p>Create your first page to get started.</p>
              <Link href="/admin/collections/pages/create" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <PlusIcon /> New Page
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Page Title</th>
                  <th>Route / Slug</th>
                  <th>Sections</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const status = page.status || page._status || 'draft'
                  const statusBadge =
                    status === 'published' ? 'badge-success' : 'badge-warning'
                  const route = `/${page.slug}`
                  return (
                    <tr key={page.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{page.title}</div>
                        {page.summary && (
                          <div className="text-xs text-muted" style={{ marginTop: 2, maxWidth: 280 }}>
                            {page.summary.length > 80
                              ? page.summary.slice(0, 80) + '…'
                              : page.summary}
                          </div>
                        )}
                      </td>
                      <td>
                        <code style={{
                          fontSize: 12,
                          background: 'hsl(var(--muted-bg))',
                          padding: '2px 6px',
                          borderRadius: 4,
                          color: 'hsl(var(--primary))',
                        }}>
                          {route}
                        </code>
                      </td>
                      <td className="text-muted text-xs">
                        {page.sections?.length ?? 0} section{(page.sections?.length ?? 0) !== 1 ? 's' : ''}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`}>
                          {String(status).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-xs text-muted">{formatDate(page.updatedAt)}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/admin/collections/pages/${page.id}`}
                            className="btn btn-outline btn-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <EditIcon /> Edit
                          </Link>
                          {status === 'published' && (
                            <Link
                              href={route}
                              className="btn btn-outline btn-xs"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ViewIcon /> View
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        {pages.length > 0 && (
          <div className="card-footer">
            {pages.length} pages total · {publishedCount} published · {draftCount} drafts
          </div>
        )}
      </div>
    </main>
  )
}
