import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FlightBoardPreviewLive } from '@/components/ui/flight-board-preview-live'
import type { FlightBoardResponse } from '@/lib/integrations/flights/types'

vi.mock('@/hooks/use-live-api-data', () => ({
  useLiveApiData: vi.fn(
    ({ initialData }: { initialData: FlightBoardResponse }) => ({
      data: initialData,
      error: new Error('network error'),
    }),
  ),
}))

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    locale: 'en',
    t: (key: string) => key,
    localePath: (path: string) => path,
  }),
}))

const flightBoard: FlightBoardResponse = {
  boardType: 'arrivals',
  configured: true,
  providerLabel: 'AirLabs',
  fetchedAt: '2026-04-15T08:00:00.000Z',
  message: '1 arrivals found.',
  records: [],
}

describe('FlightBoardPreviewLive', () => {
  it('shows a stale-data warning when refreshes fail', () => {
    render(
      <FlightBoardPreviewLive initialArrivals={flightBoard} initialDepartures={flightBoard} />,
    )

    expect(
      screen.getByText('Live flight data could not be refreshed. Showing the last available data.'),
    ).toBeInTheDocument()
  })
})
