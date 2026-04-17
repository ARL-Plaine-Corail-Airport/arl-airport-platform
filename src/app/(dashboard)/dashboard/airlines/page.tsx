import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'
import { formatDate } from '@/lib/date'
import type { Airline } from '@/payload-types'

export const metadata = { title: 'Airlines' }

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

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export default async function AirlinesPage() {
  await requireDashboardSectionAccess('airlines')
  const payload = await getPayloadClient()
  let airlines: Airline[] = []

  try {
    const result = await payload.find({
      collection: 'airlines',
      depth: 0,
      limit: 100,
      sort: 'displayOrder',
      overrideAccess: true,
    })
    airlines = result.docs
  } catch (error) { logger.error('Failed to fetch airlines', error, 'dashboard') }

  const activeCount = airlines.filter((a) => a.isActive).length
  const inactiveCount = airlines.filter((a) => !a.isActive).length
  const totalDestinations = airlines.reduce((sum, a) => sum + (a.destinations?.length ?? 0), 0)

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Airlines</h1>
          <p className="page-subtitle">
            Airlines operating at Plaine Corail Airport, Rodrigues
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/collections/airlines/create" className="btn btn-primary">
            <PlusIcon />
            Add Airline
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Airlines</div>
            <div className="stat-value">{airlines.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{ color: 'hsl(var(--success))' }}>{activeCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Suspended</div>
            <div className="stat-value" style={{ color: 'hsl(var(--muted))' }}>{inactiveCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Destinations</div>
            <div className="stat-value">{totalDestinations}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            type="search"
            placeholder="Search airlines..."
            disabled
          />
        </div>
        <select className="filter-select" disabled>
          <option>All Airlines</option>
          <option>Active Only</option>
          <option>Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Airlines ({airlines.length})</h2>
          <Link
            href="/admin/collections/airlines"
            className="btn btn-outline btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Payload
          </Link>
        </div>
        <div className="table-wrap">
          {airlines.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <h3>No airlines added yet</h3>
              <p>Add the airlines that operate at Rodrigues Airport.</p>
              <Link href="/admin/collections/airlines/create" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <PlusIcon /> Add Airline
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Order</th>
                  <th>Airline</th>
                  <th>IATA</th>
                  <th>ICAO</th>
                  <th>Destinations</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {airlines.map((airline) => {
                  const destinations = (airline.destinations ?? []) as Array<{
                    city?: string
                    airportCode?: string | null
                  }>
                  const destStr = destinations
                    .slice(0, 3)
                    .map(
                      (destination) =>
                        `${destination.city ?? 'Unknown'}${
                          destination.airportCode ? ` (${destination.airportCode})` : ''
                        }`,
                    )
                    .join(', ')
                  const moreCount = destinations.length - 3

                  return (
                    <tr key={airline.id}>
                      <td className="text-muted text-xs" style={{ textAlign: 'center' }}>
                        {airline.displayOrder ?? '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{airline.name}</div>
                        {airline.website && (
                          <a
                            href={airline.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs"
                            style={{ color: 'hsl(var(--primary))', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <GlobeIcon />
                            Website
                          </a>
                        )}
                      </td>
                      <td>
                        <code style={{
                          fontSize: 13,
                          fontWeight: 700,
                          background: 'hsl(var(--muted-bg))',
                          padding: '2px 8px',
                          borderRadius: 4,
                          letterSpacing: '0.5px',
                        }}>
                          {airline.iataCode}
                        </code>
                      </td>
                      <td>
                        {airline.icaoCode ? (
                          <code style={{
                            fontSize: 12,
                            background: 'hsl(var(--muted-bg))',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}>
                            {airline.icaoCode}
                          </code>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="text-xs">
                          {destinations.length === 0 ? (
                            <span className="text-muted">No destinations</span>
                          ) : (
                            <>
                              {destStr}
                              {moreCount > 0 && (
                                <span className="text-muted"> +{moreCount} more</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="text-xs text-muted">
                        {airline.contactPhone ?? '—'}
                      </td>
                      <td>
                        {airline.isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-muted">Suspended</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/admin/collections/airlines/${airline.id}`}
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
        {airlines.length > 0 && (
          <div className="card-footer">
            {activeCount} active · {inactiveCount} suspended · {totalDestinations} total destinations
          </div>
        )}
      </div>
    </main>
  )
}
