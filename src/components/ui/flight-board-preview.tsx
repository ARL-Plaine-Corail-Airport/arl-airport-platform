'use client'

import Link from 'next/link'

import { formatDateTime } from '@/lib/date'
import { statusBadgeClass, statusBadgeLabel } from '@/lib/flight-status'
import { useI18n } from '@/i18n/provider'

type FlightRecord = {
  id: string
  airline?: string
  flightNumber: string
  route: string
  scheduledTime: string
  estimatedTime?: string
  remarks?: string
}

type FlightPanelProps = {
  data: any
  type: 'arrivals' | 'departures'
}

function FlightPanel({ data, type }: FlightPanelProps) {
  const isArrivals = type === 'arrivals'
  const { t, localePath: lp, locale } = useI18n()


  return (
    <div className="flight-panel">
      <div className="flight-panel__header">
        <div className="flight-panel__title">
          {isArrivals ? (
            <svg width="16" height="16" fill="none" stroke="var(--primary)" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 22h20" />
              <path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.38-.24L4.29 11.15a2 2 0 0 1-.52-.38z" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="var(--primary)" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 22h20" />
              <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l1.05-.53a2 2 0 0 1 2.15.18l6.3 4.73 4.45-2.22a2 2 0 0 1 2.55.88l.52.97a1 1 0 0 1-.58 1.4L7.3 17.12a2 2 0 0 1-.94.28z" />
            </svg>
          )}
          {isArrivals ? t('flights.arrivals_title') : t('flights.departures_title')}
        </div>
        <Link
          href={lp(isArrivals ? '/arrivals' : '/departures')}
          className="flight-panel__link"
        >
          {t('flights.view_all')}
        </Link>
      </div>

      {!data.configured || !data.records?.length ? (
        <div style={{ padding: '1.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
          {data.configured ? t('flights.no_flights_available') : t('flights.flight_data_not_connected')}
        </div>
      ) : (
        <>
          {data.records.slice(0, 3).map((record: FlightRecord) => {
            const isDelayed =
              record.estimatedTime &&
              record.scheduledTime &&
              record.estimatedTime !== record.scheduledTime

            return (
              <div key={record.id} className="flight-row">
                <div className="flight-row__info">
                  <p className="flight-row__number">{record.flightNumber}</p>
                  <p className="flight-row__route">{record.route}</p>
                </div>
                <div className="flight-row__right">
                  <div>
                    <p className="flight-row__time">{formatDateTime(record.estimatedTime ?? record.scheduledTime, locale)}</p>
                    {isDelayed && (
                      <p className="flight-row__time-old">{formatDateTime(record.scheduledTime, locale)}</p>
                    )}
                  </div>
                  <span className={`status-badge ${statusBadgeClass(record.remarks ?? '')}`}>
                    {statusBadgeLabel(record.remarks ?? '', t)}
                  </span>
                </div>
              </div>
            )
          })}
        </>
      )}

      <div className="flight-panel__notice">
        <p>
          {t('flights.live_data')} - {data.providerLabel ?? t('flights.not_configured')}
          {data.fetchedAt && <> · {t('flights.last_updated')} {formatDateTime(data.fetchedAt, locale)}</>}
        </p>
      </div>
    </div>
  )
}

type FlightBoardPreviewProps = {
  arrivals: any
  departures: any
}

export function FlightBoardPreview({ arrivals, departures }: FlightBoardPreviewProps) {
  return (
    <section className="section">
      <div className="container">
        <div className="flight-preview-grid">
          <FlightPanel data={arrivals} type="arrivals" />
          <FlightPanel data={departures} type="departures" />
        </div>
      </div>
    </section>
  )
}
