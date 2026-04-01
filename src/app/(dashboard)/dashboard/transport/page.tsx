import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'

export const metadata = { title: 'Transport & Parking' }

function ExternalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
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

export default async function TransportPage() {
  await requireDashboardSectionAccess('transport')
  const payload = await getPayloadClient()
  let transport: any | null = null

  try {
    transport = await payload.findGlobal({
      slug: 'transport-parking',
      depth: 0,
      overrideAccess: true,
    })
  } catch (error) { logger.error('Failed to fetch transport settings', error, 'dashboard'); transport = null }

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Transport &amp; Parking</h1>
          <p className="page-subtitle">
            Manage transport options and parking information for the public site
          </p>
        </div>
        <div className="page-actions">
          <Link
            href="/transport-parking"
            className="btn btn-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ViewIcon />
            View Public Page
          </Link>
          <Link
            href="/admin/globals/transport-parking"
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalIcon />
            Edit in Payload Admin
          </Link>
        </div>
      </div>

      <div className="info-banner">
        <InfoIcon />
        <div>
          Transport &amp; Parking content is managed via the{' '}
          <strong>transport-parking</strong> Global in Payload CMS. Changes made there
          are immediately reflected on the public-facing page at{' '}
          <code style={{ background: 'hsl(210 80% 90%)', padding: '1px 4px', borderRadius: 3 }}>
            /transport-parking
          </code>
          .
        </div>
      </div>

      <div className="grid-2">
        {/* Current content preview */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Current Content</h2>
            {transport ? (
              <span className="badge badge-success">Configured</span>
            ) : (
              <span className="badge badge-muted">Not configured</span>
            )}
          </div>
          <div className="card-body">
            {transport ? (
              <div>
                <div className="form-group">
                  <label className="form-label">Page Title</label>
                  <input
                    className="form-input"
                    type="text"
                    value={transport.introTitle}
                    disabled
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Introduction</label>
                  <textarea
                    className="form-textarea"
                    value={transport.introSummary}
                    disabled
                    readOnly
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sections</label>
                  <input
                    className="form-input"
                    type="text"
                    value={`${transport.sections?.length ?? 0} section${(transport.sections?.length ?? 0) !== 1 ? 's' : ''}`}
                    disabled
                    readOnly
                  />
                </div>
                {transport.mapEmbedURL && (
                  <div className="form-group">
                    <label className="form-label">Map Embed</label>
                    <input
                      className="form-input"
                      type="url"
                      value={transport.mapEmbedURL}
                      disabled
                      readOnly
                    />
                  </div>
                )}
                <div style={{ marginTop: 16 }}>
                  <Link
                    href="/admin/globals/transport-parking"
                    className="btn btn-primary btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalIcon /> Edit in Payload
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <h3>Content not configured</h3>
                <p>Set up transport &amp; parking information in Payload admin.</p>
                <Link
                  href="/admin/globals/transport-parking"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Configure Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sections list */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Content Sections</h2>
            <span className="badge badge-muted">
              {transport?.sections?.length ?? 0} sections
            </span>
          </div>
          <div className="card-body" style={{ padding: '8px 18px' }}>
            {transport?.sections && transport.sections.length > 0 ? (
              transport.sections.map((
                section: {
                  id?: string | null
                  heading?: string | null
                  body?: string | null
                  bullets?: Array<unknown> | null
                },
                idx: number,
              ) => (
                <div key={section.id ?? idx} style={{
                  padding: '12px 0',
                  borderBottom: idx < (transport!.sections!.length - 1) ? '1px solid hsl(var(--border))' : 'none',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {idx + 1}. {section.heading}
                  </div>
                  {section.body && (
                    <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
                      {typeof section.body === 'string'
                        ? `${section.body.replace(/<[^>]+>/g, '').slice(0, 120)}${section.body.length > 120 ? '…' : ''}`
                        : 'Rich text content'}
                    </div>
                  )}
                  {section.bullets && section.bullets.length > 0 && (
                    <div className="text-xs text-muted">
                      {section.bullets.length} bullet point{section.bullets.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No content sections configured yet.</p>
              </div>
            )}
          </div>
          {transport && (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Last updated: {transport.updatedAt ? new Date(transport.updatedAt).toLocaleDateString('en-GB') : '—'}</span>
              <Link
                href="/admin/globals/transport-parking"
                className="btn btn-outline btn-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalIcon /> Edit
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Transport options overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Transport Options Overview</h2>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ marginBottom: 0 }}>
            {[
              { icon: '🚕', label: 'Taxis', desc: 'Pre-booked and rank taxis' },
              { icon: '🚌', label: 'Bus Services', desc: 'Rodrigues Bus Transport' },
              { icon: '🚗', label: 'Car Hire', desc: 'Rental vehicles on-site' },
              { icon: '🅿', label: 'Parking', desc: 'Short and long-stay parking' },
              { icon: '🚶', label: 'Walking Routes', desc: 'Connections on foot' },
              { icon: '♿', label: 'Accessible Transport', desc: 'Mobility assistance' },
            ].map((item) => (
              <div key={item.label} style={{
                padding: '14px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--muted-bg))',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }} aria-hidden="true">{item.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                <div className="text-xs text-muted">{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Link
              href="/admin/globals/transport-parking"
              className="btn btn-primary btn-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalIcon />
              Manage All Transport Content in Payload
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
