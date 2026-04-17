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
  const { data: arrivals } = useLiveApiData<FlightBoardResponse>({
    initialData: initialArrivals,
    refreshIntervalMs: FLIGHT_REFRESH_INTERVAL_MS,
    url: '/api/flight-board?type=arrivals',
  })
  const { data: departures } = useLiveApiData<FlightBoardResponse>({
    initialData: initialDepartures,
    refreshIntervalMs: FLIGHT_REFRESH_INTERVAL_MS,
    url: '/api/flight-board?type=departures',
  })

  return <FlightBoardPreview arrivals={arrivals} departures={departures} />
}
