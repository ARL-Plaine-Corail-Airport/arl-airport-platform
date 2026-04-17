'use client'

import { FlightBoardPreview } from '@/components/ui/flight-board-preview'
import { useLiveApiData } from '@/hooks/use-live-api-data'
import type { FlightBoardResponse } from '@/lib/integrations/flights/types'

const FLIGHT_REFRESH_INTERVAL_MS = 300_000

type FlightBoardPreviewLiveProps = {
  initialArrivals: FlightBoardResponse
  initialDepartures: FlightBoardResponse
}

export function FlightBoardPreviewLive({
  initialArrivals,
  initialDepartures,
}: FlightBoardPreviewLiveProps) {
  const { data: arrivals, error: arrivalsError } = useLiveApiData<FlightBoardResponse>({
    initialData: initialArrivals,
    refreshIntervalMs: FLIGHT_REFRESH_INTERVAL_MS,
    url: '/api/flight-board?type=arrivals',
  })
  const { data: departures, error: departuresError } = useLiveApiData<FlightBoardResponse>({
    initialData: initialDepartures,
    refreshIntervalMs: FLIGHT_REFRESH_INTERVAL_MS,
    url: '/api/flight-board?type=departures',
  })

  const hasStaleDataWarning = Boolean(arrivalsError || departuresError)

  return (
    <>
      {hasStaleDataWarning ? (
        <p className="flight-board__meta" role="status" aria-live="polite">
          Live flight data could not be refreshed. Showing the last available data.
        </p>
      ) : null}
      <FlightBoardPreview arrivals={arrivals} departures={departures} />
    </>
  )
}
