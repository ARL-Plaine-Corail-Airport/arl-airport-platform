import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'
import { formatDate } from '@/lib/date'
import type { Faq } from '@/payload-types'

export const metadata = { title: 'FAQs' }

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  flights: 'Flights',
  transport: 'Transport',
  accessibility: 'Accessibility',
  documents: 'Documents',
}

const CATEGORY_BADGE: Record<string, string> = {
  general: 'badge-muted',
  flights: 'badge-info',
  transport: 'badge-primary',
  accessibility: 'badge-success',
  documents: 'badge-warning',
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

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export default async function FaqsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>
}) {
  await requireDashboardSectionAccess('faqs')
  const params = await searchParams
  const categoryFilter = params.category ?? ''
  const statusFilter = params.status ?? ''

  const payload = await getPayloadClient()
  let faqs: Faq[] = []

  try {
    const result = await payload.find({
      collection: 'faqs',
      depth: 0,
      limit: 200,
      sort: 'order',
      overrideAccess: true,
    })
    faqs = result.docs
  } catch (error) { logger.error('Failed to fetch FAQs', error, 'dashboard') }

  // Apply filters
  let filtered = faqs
  if (categoryFilter) filtered = filtered.filter((f) => f.category === categoryFilter)
  if (statusFilter) filtered = filtered.filter((f) => (f.status ?? 'draft') === statusFilter)

  const publishedCount = faqs.filter((f) => f.status === 'published').length
  const draftCount = faqs.filter((f) => !f.status || f.status === 'draft').length

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">FAQs</h1>
          <p className="page-subtitle">
            Manage frequently asked questions displayed on the public FAQ page
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/collections/faqs/create" className="btn btn-primary">
            <PlusIcon />
            New FAQ
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total FAQs</div>
            <div className="stat-value">{faqs.length}</div>
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
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Categories</div>
            <div className="stat-value">
              {new Set(faqs.map((f) => f.category).filter(Boolean)).size}
            </div>
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
            placeholder="Search FAQs..."
            disabled
          />
        </div>
        <form method="GET" action="/dashboard/faqs" style={{ display: 'contents' }}>
          <select
            className="filter-select"
            name="category"
            defaultValue={categoryFilter}
          >
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="flights">Flights</option>
            <option value="transport">Transport</option>
            <option value="accessibility">Accessibility</option>
            <option value="documents">Documents</option>
          </select>
          <select
            className="filter-select"
            name="status"
            defaultValue={statusFilter}
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button type="submit" className="btn btn-outline btn-sm">Filter</button>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {filtered.length} FAQ{filtered.length !== 1 ? 's' : ''} shown
          </h2>
          <Link
            href="/admin/collections/faqs"
            className="btn btn-outline btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Payload
          </Link>
        </div>
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3>No FAQs found</h3>
              <p>
                {categoryFilter || statusFilter
                  ? 'Try adjusting filters above.'
                  : 'Create your first FAQ to get started.'}
              </p>
              <Link href="/admin/collections/faqs/create" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <PlusIcon /> New FAQ
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Question</th>
                  <th>Category</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((faq, idx) => {
                  const status = faq.status ?? 'draft'
                  return (
                    <tr key={faq.id}>
                      <td className="text-muted text-xs">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500, maxWidth: 380 }}>
                          {faq.question.length > 100
                            ? faq.question.slice(0, 100) + '…'
                            : faq.question}
                        </div>
                        {faq.answer && (
                          <div className="text-xs text-muted" style={{ marginTop: 2, maxWidth: 380 }}>
                            {faq.answer.replace(/<[^>]+>/g, '').slice(0, 80)}…
                          </div>
                        )}
                      </td>
                      <td>
                        {faq.category ? (
                          <span className={`badge ${CATEGORY_BADGE[faq.category] ?? 'badge-muted'}`}>
                            {CATEGORY_LABELS[faq.category] ?? faq.category}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="text-muted text-xs">{faq.order ?? '—'}</td>
                      <td>
                        <span className={`badge ${status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="text-xs text-muted">{formatDate(faq.updatedAt)}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/admin/collections/faqs/${faq.id}`}
                            className="btn btn-outline btn-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <EditIcon /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="card-footer">
            {filtered.length} of {faqs.length} FAQs shown.
          </div>
        )}
      </div>
    </main>
  )
}
