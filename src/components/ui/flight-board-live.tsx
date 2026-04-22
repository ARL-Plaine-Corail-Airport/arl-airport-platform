'use client'

import { FlightBoard } from '@/components/ui/flight-board'
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
  const { data, error } = useLiveApiData<FlightBoardResponse>({
    initialData,
    refreshIntervalMs: FLIGHT_REFRESH_INTERVAL_MS,
    url: `/api/flight-board?type=${boardType}`,
  })

  return (
    <>
      {error ? (
        <p className="flight-board__meta" role="status" aria-live="polite">
          Live flight data could not be refreshed. Showing the last available data.
        </p>
      ) : null}
      <FlightBoard data={data} />
    </>
  )
}
