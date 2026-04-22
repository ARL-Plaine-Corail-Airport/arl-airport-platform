import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FlightBoardLive } from '@/components/ui/flight-board-live'
import type { FlightBoardResponse } from '@/lib/integrations/flights/types'

vi.mock('@/hooks/use-live-api-data', () => ({
  useLiveApiData: vi.fn(
    ({ initialData }: { initialData: FlightBoardResponse }) => ({
      data: initialData,
      error: new Error('network error'),
    }),
  ),
}))

const translations: Record<string, string> = {
  'flights.airline': 'Airline',
  'flights.arrivals_title': 'Arrivals',
  'flights.departures_title': 'Departures',
  'flights.estimated': 'Estimated',
  'flights.flight': 'Flight',
  'flights.last_updated': 'Last updated',
  'flights.live_data': 'Live data',
  'flights.no_records_desc': 'There are no records to display for this board at the moment.',
  'flights.provider': 'Provider',
  'flights.remarks': 'Remarks',
  'flights.route': 'Route',
  'flights.scheduled': 'Scheduled',
  'flight_status.scheduled': 'Scheduled',
}

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    locale: 'en',
    t: (key: string) => translations[key] ?? key,
  }),
}))

const flightBoard: FlightBoardResponse = {
  boardType: 'arrivals',
  configured: true,
  providerLabel: 'AirLabs',
  fetchedAt: '2026-04-15T08:00:00.000Z',
  message: '1 arrivals found.',
  records: [
    {
      id: 'MK120',
      airline: 'MK',
      flightNumber: 'MK120',
      route: 'MRU',
      scheduledTime: '2026-04-15T10:00:00.000Z',
      estimatedTime: null,
      remarks: 'Scheduled',
      lastUpdated: null,
    },
  ],
}

describe('FlightBoardLive', () => {
  it('keeps showing last known records when refreshes fail', () => {
    render(<FlightBoardLive boardType="arrivals" initialData={flightBoard} />)

    expect(
      screen.getByText('Live flight data could not be refreshed. Showing the last available data.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('MK120').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MRU').length).toBeGreaterThan(0)
    expect(screen.queryByText('flights.unavailable')).not.toBeInTheDocument()
  })
})
