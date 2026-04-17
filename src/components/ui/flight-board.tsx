'use client'

import { useI18n } from '@/i18n/provider'
import { formatDateTime } from '@/lib/date'
import { statusBadgeClass, statusBadgeLabel } from '@/lib/flight-status'

export function FlightBoard({ data }: { data: any }) {
  const { t, locale } = useI18n()
  const boardLabel =
    data.boardType === 'arrivals'
      ? t('flights.arrivals_title')
      : t('flights.departures_title')
  const emptyMessage =
    data.degraded && data.message
      ? data.message
      : t('flights.no_records_desc')

  if (!data.configured) {
    return (
      <section className="card table-card flight-board-shell">
        <div className="flight-board__head">
          <div>
            <p className="flight-board__eyebrow">{t('flights.provider')}</p>
            <h2 className="flight-board__title">{boardLabel}</h2>
          </div>
          <div className="flight-board__status">
            <span className="flight-board__provider">{data.providerLabel}</span>
          </div>
        </div>
        <p className="flight-board__meta">{data.message}</p>
      </section>
    )
  }

  if (!data.records?.length) {
    return (
      <section className="card table-card flight-board-shell">
        <div className="flight-board__head">
          <div>
            <p className="flight-board__eyebrow">{t('flights.live_data')}</p>
            <h2 className="flight-board__title">{boardLabel}</h2>
          </div>
          <div className="flight-board__status">
            <span className="flight-board__provider">{data.providerLabel}</span>
          </div>
        </div>
        <p className="flight-board__meta">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="card table-card flight-board-shell">
      <div className="flight-board__head">
        <div>
          <p className="flight-board__eyebrow">{t('flights.live_data')}</p>
          <h2 className="flight-board__title">{boardLabel}</h2>
        </div>
        <div className="flight-board__status">
          <span className="flight-board__count">
            {String(data.records.length).padStart(2, '0')}
          </span>
          <span className="flight-board__provider">{data.providerLabel}</span>
        </div>
      </div>

      <p className="flight-board__meta">
        {t('flights.last_updated')} {formatDateTime(data.fetchedAt, locale)}
      </p>

      <div className="flight-table-desktop">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('flights.airline')}</th>
                <th>{t('flights.flight')}</th>
                <th>{t('flights.route')}</th>
                <th>{t('flights.scheduled')}</th>
                <th>{t('flights.estimated')}</th>
                <th>{t('flights.remarks')}</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((record: any) => (
                <tr key={record.id}>
                  <td>{record.airline}</td>
                  <td>{record.flightNumber}</td>
                  <td>{record.route}</td>
                  <td>{formatDateTime(record.scheduledTime, locale)}</td>
                  <td>{formatDateTime(record.estimatedTime, locale)}</td>
                  <td>
                    <span className={`status-badge ${statusBadgeClass(record.remarks ?? '')}`}>
                      {statusBadgeLabel(record.remarks ?? '', t)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flight-list-mobile">
        {data.records.map((record: any) => {
          const isDelayed =
            record.estimatedTime &&
            record.scheduledTime &&
            record.estimatedTime !== record.scheduledTime

          return (
            <div key={record.id} className="flight-mobile-card">
              <div className="flight-mobile-card__top">
                <div>
                  <p className="flight-row__number">{record.flightNumber}</p>
                  <p className="flight-row__route">{record.airline} · {record.route}</p>
                </div>
                <span className={`status-badge ${statusBadgeClass(record.remarks ?? '')}`}>
                  {statusBadgeLabel(record.remarks ?? '', t)}
                </span>
              </div>
              <div className="flight-mobile-card__times">
                <div>
                  <span className="flight-mobile-card__label">{t('flights.scheduled')}</span>
                  <span className="flight-row__time">{formatDateTime(record.scheduledTime, locale)}</span>
                </div>
                {record.estimatedTime ? (
                  <div>
                    <span className="flight-mobile-card__label">{t('flights.estimated')}</span>
                    <span className={`flight-row__time${isDelayed ? ' flight-row__time--delayed' : ''}`}>
                      {formatDateTime(record.estimatedTime, locale)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
