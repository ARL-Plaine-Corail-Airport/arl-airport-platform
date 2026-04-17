import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'
import { formatDateTime as formatDate } from '@/lib/date'
import type { Notice } from '@/payload-types'

export const metadata = { title: 'Emergency Banners' }

function formatStatusLabel(status?: string | null): string {
  return status ? status.replace('_', ' ') : '—'
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

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default async function EmergencyPage() {
  await requireDashboardSectionAccess('emergency')
  const payload = await getPayloadClient()

  let activeAlerts: Notice[] = []
  let allUrgent: Notice[] = []

  try {
    // Active banners: published + urgent + promoteToBanner
    const result = await payload.find({
      collection: 'notices',
      depth: 0,
      limit: 50,
      sort: '-publishedAt',
      overrideAccess: true,
      where: {
        and: [
          { urgent: { equals: true } },
          { promoteToBanner: { equals: true } },
          { status: { equals: 'published' } },
        ],
      },
    })
    activeAlerts = result.docs
  } catch (error) { logger.error('Failed to fetch emergency notices', error, 'dashboard') }

  try {
    // All urgent notices
    const result = await payload.find({
      collection: 'notices',
      depth: 0,
      limit: 20,
      sort: '-updatedAt',
      overrideAccess: true,
      where: { urgent: { equals: true } },
    })
    allUrgent = result.docs
  } catch (error) { logger.error('Failed to fetch urgent notices', error, 'dashboard') }

  return (
    <main className="page-content">
      {/* Title row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Emergency Banners</h1>
          <p className="page-subtitle">
            Active emergency alerts and site-wide notification banners
          </p>
        </div>
        <div className="page-actions">
          <Link
            href="/admin/collections/notices/create"
            className="btn btn-danger"
          >
            <PlusIcon />
            Create Emergency Alert
          </Link>
        </div>
      </div>

      {/* Banner preview */}
      {activeAlerts.length > 0 ? (
        <div>
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="emergency-preview">
              <div className="emergency-preview-icon" aria-hidden="true">⚠️</div>
              <div className="emergency-preview-body">
                <strong>{alert.title}</strong>
                <p>{alert.summary}</p>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'hsl(0 50% 40%)' }}>
                    Published: {formatDate(alert.publishedAt)}
                  </span>
                  {alert.expiresAt && (
                    <span style={{ fontSize: 11, color: 'hsl(0 50% 40%)' }}>
                      · Expires: {formatDate(alert.expiresAt)}
                    </span>
                  )}
                  <Link
                    href={`/admin/collections/notices/${alert.id}`}
                    className="btn btn-outline btn-xs"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: 8 }}
                  >
                    <EditIcon /> Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="emergency-preview" style={{ borderColor: 'hsl(145 60% 50%)', background: 'hsl(145 60% 96%)' }}>
          <div className="emergency-preview-icon" aria-hidden="true">✅</div>
          <div className="emergency-preview-body">
            <strong style={{ color: 'hsl(145 60% 28%)' }}>All Clear — No Active Emergency Alerts</strong>
            <p style={{ color: 'hsl(145 40% 30%)' }}>
              No emergency banners are currently active. The public site is displaying
              its normal state.
            </p>
          </div>
        </div>
      )}

      {/* How to use */}
      <div className="info-banner">
        <AlertIcon />
        <div>
          <strong>How emergency banners work:</strong>{' '}
          Emergency banners are regular Notices with{' '}
          <strong>Urgent</strong> checked and <strong>Promote to Banner</strong> enabled, then{' '}
          published. The public site surfaces the most recent published urgent banner
          in the site-wide alert area. To dismiss, set the notice status to{' '}
          <strong>Expired</strong> or <strong>Archived</strong> in Payload admin.
        </div>
      </div>

      <div className="grid-2">
        {/* Create form UI */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Create Emergency Alert</h2>
          </div>
          <div className="card-body">
            <p className="text-muted text-small" style={{ marginBottom: 16 }}>
              Emergency alerts are created and managed through the Notices collection.
              Use the form in Payload admin to create a fully configured alert.
            </p>
            <div className="form-group">
              <span className="form-label">Title (preview)</span>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Airport Closure — Tropical Cyclone Warning"
                disabled
              />
            </div>
            <div className="form-group">
              <span className="form-label">Message (preview)</span>
              <textarea
                className="form-textarea"
                placeholder="Alert message visible to all passengers..."
                disabled
                rows={3}
              />
            </div>
            <div className="form-group">
              <span className="form-label">Expires At (preview)</span>
              <input className="form-input" type="datetime-local" disabled />
            </div>
            <div style={{ marginTop: 8 }}>
              <Link
                href="/admin/collections/notices/create"
                className="btn btn-danger"
              >
                <PlusIcon />
                Create in Payload Admin
              </Link>
              <p className="form-hint" style={{ marginTop: 8 }}>
                Remember to enable <strong>Urgent</strong> and{' '}
                <strong>Promote to Banner</strong> fields, and set status to{' '}
                <strong>Published</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* All urgent notices */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Urgent Notices</h2>
            <span className="badge badge-danger">{allUrgent.length} urgent</span>
          </div>
          <div className="table-wrap">
            {allUrgent.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <p>No urgent notices on record.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Banner</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUrgent.map((notice) => (
                    <tr key={notice.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{notice.title}</div>
                        <div className="text-xs text-muted">{formatDate(notice.updatedAt)}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          notice.status === 'published' ? 'badge-danger' :
                          notice.status === 'approved' ? 'badge-warning' :
                          'badge-muted'
                        }`}>
                          {formatStatusLabel(notice.status)}
                        </span>
                      </td>
                      <td>
                        {notice.promoteToBanner ? (
                          <span className="badge badge-danger">Active</span>
                        ) : (
                          <span className="badge badge-muted">No</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/admin/collections/notices/${notice.id}`}
                          className="btn btn-outline btn-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <EditIcon /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Preview section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Banner Preview (Sample)</h2>
          <span className="badge badge-muted">Preview only</span>
        </div>
        <div className="card-body">
          <p className="text-muted text-small" style={{ marginBottom: 16 }}>
            This is how an emergency banner appears to passengers on the public site:
          </p>
          <div style={{
            background: 'hsl(0 72% 25%)',
            color: '#fff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 6,
          }}>
            <span style={{ fontSize: 20 }} aria-hidden="true">⚠️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: 2 }}>
                IMPORTANT NOTICE: Airport Operations Update
              </strong>
              <span style={{ fontSize: 13, opacity: 0.9 }}>
                This is a sample emergency banner message visible to all visitors on the public
                website. It will appear until the notice is archived or expired.
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
