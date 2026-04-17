'use client'

import { FlightBoard } from '@/components/ui/flight-board'
import { useI18n } from '@/i18n/provider'
import { useLiveApiData } from '@/hooks/use-live-api-data'
import type {
  FlightBoardResponse,
  FlightBoardType,
} from '@/lib/integrations/flights/types'

const FLIGHT_REFRESH_INTERVAL_MS = 300_000

type FlightBoardLiveProps = {
  boardType: FlightBoardType
  initialData: FlightBoardResponse
}

export function FlightBoardLive({
  boardType,
  initialData,
}: FlightBoardLiveProps) {
  const { t } = useI18n()
  const { data, error } = useLiveApiData<FlightBoardResponse>({
    initialData,
    refreshIntervalMs: FLIGHT_REFRESH_INTERVAL_MS,
    url: `/api/flight-board?type=${boardType}`,
  })

  if (error) {
    const boardLabel =
      boardType === 'arrivals'
        ? t('flights.arrivals_title')
        : t('flights.departures_title')

    return (
      <section className="card table-card flight-board-shell" role="status" aria-live="polite">
        <div className="flight-board__head">
          <div>
            <p className="flight-board__eyebrow">{t('flights.live_data')}</p>
            <h2 className="flight-board__title">{boardLabel}</h2>
          </div>
        <div className="flight-board__status">
          <span className="flight-board__provider">{data.providerLabel}</span>
        </div>
      </div>
      <p className="flight-board__meta">{t('flights.unavailable')}</p>
      </section>
    )
  }

  return <FlightBoard data={data} />
}
