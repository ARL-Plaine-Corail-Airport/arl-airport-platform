import 'server-only'

import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { serverEnv } from '@/lib/env.server'
import { getFlightBoard } from '@/lib/integrations/flights'
import { logger } from '@/lib/logger'
import type { FlightRecord, FlightBoardResponse } from '@/lib/integrations/flights/types'

export const metadata = { title: 'Flights' }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRemarksBadge(remarks: string): { cls: string; label: string } {
  const r = (remarks ?? '').toLowerCase()
  if (r.includes('cancel'))  return { cls: 'badge-danger',  label: 'Cancelled' }
  if (r.includes('delay'))   return { cls: 'badge-warning', label: 'Delayed' }
  if (r.includes('depart'))  return { cls: 'badge-info',    label: 'Departed' }
  if (r.includes('land') || r.includes('arrived')) return { cls: 'badge-success', label: 'Landed' }
  if (r.includes('on time') || r.includes('on-time') || r === 'on time') {
    return { cls: 'badge-success', label: 'On Time' }
  }
  if (r.includes('board'))   return { cls: 'badge-info',    label: 'Boarding' }
  if (remarks)               return { cls: 'badge-muted',   label: remarks }
  return { cls: 'badge-muted', label: 'Unknown' }
}

function formatTime(t: string | null | undefined): string {
  if (!t) return '—'
  return t
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Flight board table
// ---------------------------------------------------------------------------

function FlightTable({
  records,
  boardType,
}: {
  records: FlightRecord[]
  boardType: 'arrivals' | 'departures'
}) {
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2l-.4.9 6.8 2.7-1.7 3.5-3.2 1.5.2.8 4.7-1.2 2.7 6.8.9-.4z" />
        </svg>
        <h3>No {boardType} data</h3>
        <p>No flight records are available. Configure an official flight data source to populate this board.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Flight</th>
            <th>Airline</th>
            <th>Route</th>
            <th>Scheduled</th>
            <th>Estimated</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {records.map((flight) => {
            const badge = getRemarksBadge(flight.remarks)
            return (
              <tr key={flight.id}>
                <td>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>
                    {flight.flightNumber}
                  </span>
                </td>
                <td>{flight.airline}</td>
                <td>{flight.route}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(flight.scheduledTime)}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {flight.estimatedTime ? (
                    <span style={{ color: flight.estimatedTime !== flight.scheduledTime ? 'hsl(38 92% 35%)' : 'inherit' }}>
                      {formatTime(flight.estimatedTime)}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${badge.cls}`}>{badge.label}</span>
                </td>
                <td className="text-muted text-xs">
                  {flight.lastUpdated ? new Date(flight.lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  await requireDashboardSectionAccess('flights')
  const params = await searchParams
  const activeType: 'arrivals' | 'departures' =
    params.type === 'departures' ? 'departures' : 'arrivals'

  let arrivalsBoard: FlightBoardResponse = {
    configured: false,
    providerLabel: '',
    boardType: 'arrivals',
    fetchedAt: null,
    message: '',
    records: [],
  }
  let departuresBoard: FlightBoardResponse = {
    configured: false,
    providerLabel: '',
    boardType: 'departures',
    fetchedAt: null,
    message: '',
    records: [],
  }

  try { arrivalsBoard = await getFlightBoard('arrivals') } catch (error) { logger.error('Failed to fetch arrivals', error, 'dashboard') }
  try { departuresBoard = await getFlightBoard('departures') } catch (error) { logger.error('Failed to fetch departures', error, 'dashboard') }

  const activeBoard = activeType === 'arrivals' ? arrivalsBoard : departuresBoard

  return (
    <main className="page-content">
      {/* Page title */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Flight Management</h1>
          <p className="page-subtitle">
            Real-time arrivals and departures at Plaine Corail Airport
          </p>
        </div>
        <div className="page-actions">
          {activeBoard.fetchedAt && (
            <span className="text-muted text-xs" style={{ alignSelf: 'center' }}>
              Updated: {new Date(activeBoard.fetchedAt).toLocaleTimeString('en-GB')}
            </span>
          )}
        </div>
      </div>

      {/* Info banner if not configured */}
      {!activeBoard.configured && (
        <div className="info-banner">
          <InfoIcon />
          <div>
            <strong>Flight data source not configured.</strong>{' '}
            {activeBoard.message} Current mode: <strong>{serverEnv.flightProviderMode}</strong>. Endpoint
            configured: <strong>{serverEnv.flightProviderEndpoint ? 'Yes' : 'No'}</strong>. Review
            integration details on{' '}
            <Link href="/dashboard/settings" style={{ color: 'inherit', fontWeight: 600 }}>
              the settings page
            </Link>
            .
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <Link
          href="/dashboard/flights?type=arrivals"
          className={`tab${activeType === 'arrivals' ? ' active' : ''}`}
        >
          Arrivals
          {arrivalsBoard.configured && (
            <span className="badge badge-info" style={{ fontSize: 10, padding: '1px 6px' }}>
              {arrivalsBoard.records.length}
            </span>
          )}
        </Link>
        <Link
          href="/dashboard/flights?type=departures"
          className={`tab${activeType === 'departures' ? ' active' : ''}`}
        >
          Departures
          {departuresBoard.configured && (
            <span className="badge badge-info" style={{ fontSize: 10, padding: '1px 6px' }}>
              {departuresBoard.records.length}
            </span>
          )}
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            type="search"
            placeholder="Search flight number, airline..."
            disabled
            title="Search is available when flight data is configured"
          />
        </div>
        <select className="filter-select" disabled>
          <option>All Airlines</option>
        </select>
        <select className="filter-select" disabled>
          <option>All Statuses</option>
        </select>
      </div>

      {/* Board card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {activeType === 'arrivals' ? 'Arrivals Board' : 'Departures Board'}
          </h2>
          {activeBoard.configured && activeBoard.providerLabel && (
            <span className="badge badge-info">{activeBoard.providerLabel}</span>
          )}
        </div>
        <FlightTable records={activeBoard.records} boardType={activeType} />
        {activeBoard.configured && (
          <div className="card-footer">
            Showing {activeBoard.records.length} flight{activeBoard.records.length !== 1 ? 's' : ''}.
            Data provided by {activeBoard.providerLabel || 'external feed'}.
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="stat-value">{arrivalsBoard.records.length}</div>
            <div className="stat-label">Total Arrivals</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="stat-value">{departuresBoard.records.length}</div>
            <div className="stat-label">Total Departures</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="stat-value">
              {[...arrivalsBoard.records, ...departuresBoard.records].filter((r) =>
                r.remarks?.toLowerCase().includes('delay')
              ).length}
            </div>
            <div className="stat-label">Delayed Flights</div>
          </div>
        </div>
      </div>
    </main>
  )
}
