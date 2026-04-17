import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'
import type { Page } from '@/payload-types'

export const metadata = { title: 'Amenities & Services' }

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

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

export default async function AmenitiesPage() {
  await requireDashboardSectionAccess('amenities')
  const payload = await getPayloadClient()

  // Amenities are managed as Pages in Payload with the slug "amenities"
  let amenitiesPage: Page | null = null
  let relatedPages: Page[] = []

  try {
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })
    const allPages = result.docs
    amenitiesPage = allPages.find((p) => p.slug === 'amenities') ?? null
    // Related service pages
    relatedPages = allPages.filter((p) =>
      ['vip-lounge', 'airport-map', 'accessibility', 'passenger-guide'].includes(p.slug)
    )
  } catch (error) { logger.error('Failed to fetch amenities pages', error, 'dashboard') }

  // Known amenity service categories
  const serviceCategories = [
    { icon: '🛋', name: 'VIP Lounge', slug: 'vip-lounge', global: 'vip-lounge' },
    { icon: '♿', name: 'Accessibility Services', slug: 'accessibility', global: 'accessibility-info' },
    { icon: '🗺', name: 'Airport Map', slug: 'airport-map', global: 'airport-map' },
    { icon: '🍽', name: 'Dining & Retail', slug: 'amenities', global: null },
    { icon: '🚿', name: 'Facilities', slug: 'amenities', global: null },
    { icon: '📶', name: 'Wi-Fi & Connectivity', slug: 'amenities', global: null },
  ]

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Amenities &amp; Services</h1>
          <p className="page-subtitle">
            Manage airport amenities, facilities, and service information
          </p>
        </div>
        <div className="page-actions">
          <Link href="/amenities" className="btn btn-outline" target="_blank" rel="noopener noreferrer">
            <ViewIcon />
            View Public Page
          </Link>
          <Link href="/admin/collections/pages/create" className="btn btn-primary">
            <PlusIcon />
            New Page
          </Link>
        </div>
      </div>

      <div className="info-banner">
        <InfoIcon />
        <div>
          <strong>How amenities are managed:</strong> Airport amenities and services are
          content-managed through two routes: (1) the <strong>Pages</strong> collection using
          the slug <code style={{ background: 'hsl(210 80% 90%)', padding: '1px 4px', borderRadius: 3 }}>amenities</code>,
          and (2) dedicated Payload <strong>Globals</strong> (VIP Lounge, Airport Map,
          Accessibility Info). Use Payload admin to update content directly.
        </div>
      </div>

      <div className="grid-2">
        {/* Amenities Page card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Amenities CMS Page</h2>
            {amenitiesPage ? (
              <span className={`badge ${
                (amenitiesPage.status ?? amenitiesPage._status) === 'published'
                  ? 'badge-success' : 'badge-warning'
              }`}>
                {amenitiesPage.status ?? amenitiesPage._status ?? 'draft'}
              </span>
            ) : (
              <span className="badge badge-muted">Not created</span>
            )}
          </div>
          <div className="card-body">
            {amenitiesPage ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div className="form-label">Page Title</div>
                  <div style={{ fontWeight: 500 }}>{amenitiesPage.title}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div className="form-label">Route</div>
                  <code style={{
                    fontSize: 13,
                    background: 'hsl(var(--muted-bg))',
                    padding: '3px 8px',
                    borderRadius: 4,
                    color: 'hsl(var(--primary))',
                  }}>
                    /amenities
                  </code>
                </div>
                {amenitiesPage.summary && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="form-label">Summary</div>
                    <p className="text-small text-muted" style={{ margin: 0 }}>
                      {amenitiesPage.summary}
                    </p>
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <div className="form-label">Sections</div>
                  <div>{amenitiesPage.sections?.length ?? 0} section{(amenitiesPage.sections?.length ?? 0) !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <Link
                    href={`/admin/collections/pages/${amenitiesPage.id}`}
                    className="btn btn-primary btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <EditIcon /> Edit Page
                  </Link>
                  <Link
                    href="/amenities"
                    className="btn btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ViewIcon /> View Live
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>
                  The amenities page (slug: <code>amenities</code>) has not been created yet.
                </p>
                <Link
                  href="/admin/collections/pages/create"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8 }}
                >
                  <PlusIcon /> Create Amenities Page
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Globals management */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Service Globals</h2>
          </div>
          <div className="card-body" style={{ padding: '8px 18px' }}>
            {[
              { label: 'VIP Lounge', slug: 'vip-lounge', icon: '🛋' },
              { label: 'Airport Map', slug: 'airport-map', icon: '🗺' },
              { label: 'Accessibility Info', slug: 'accessibility-info', icon: '♿' },
              { label: 'Passenger Guide', slug: 'passenger-guide', icon: '📋' },
            ].map((item) => (
              <div key={item.slug} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid hsl(var(--border))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }} aria-hidden="true">{item.icon}</span>
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                </div>
                <Link
                  href={`/admin/globals/${item.slug}`}
                  className="btn btn-outline btn-xs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <EditIcon /> Edit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service categories overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Service Categories</h2>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ marginBottom: 0 }}>
            {serviceCategories.map((service) => (
              <div key={service.name} style={{
                padding: '16px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'hsl(var(--muted-bg))',
              }}>
                <span style={{ fontSize: 28 }} aria-hidden="true">{service.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{service.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {service.global ? (
                      <Link
                        href={`/admin/globals/${service.global}`}
                        className="btn btn-outline btn-xs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalIcon /> Edit
                      </Link>
                    ) : (
                      <Link
                        href={amenitiesPage ? `/admin/collections/pages/${amenitiesPage.id}` : '/admin/collections/pages/create'}
                        className="btn btn-outline btn-xs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalIcon /> Manage
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
