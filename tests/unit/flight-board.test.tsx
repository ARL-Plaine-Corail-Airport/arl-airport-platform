import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FlightBoard } from '@/components/ui/flight-board'

const translations: Record<string, string> = {
  'flights.arrivals_title': 'Arrivals',
  'flights.departures_title': 'Departures',
  'flights.live_data': 'Live data',
  'flights.no_records_desc': 'There are no records to display for this board at the moment.',
  'flights.provider': 'Provider',
}

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    locale: 'en',
    t: (key: string) => translations[key] ?? key,
  }),
}))

describe('FlightBoard', () => {
  it('shows the degraded provider message when the board is empty', () => {
    render(
      <FlightBoard
        data={{
          boardType: 'arrivals',
          configured: true,
          providerLabel: 'AirLabs',
          message:
            'Unable to fetch flight data: AirLabs error: The monthly request limit has been exceeded.',
          records: [],
          degraded: true,
          fetchedAt: '2026-04-09T10:00:00.000Z',
        }}
      />,
    )

    expect(
      screen.getByText(
        'Unable to fetch flight data: AirLabs error: The monthly request limit has been exceeded.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(translations['flights.no_records_desc']),
    ).not.toBeInTheDocument()
  })

  it('keeps the standard empty-state copy for healthy empty payloads', () => {
    render(
      <FlightBoard
        data={{
          boardType: 'arrivals',
          configured: true,
          providerLabel: 'AirLabs',
          message: 'No arrivals scheduled at this time.',
          records: [],
          degraded: false,
          fetchedAt: '2026-04-09T10:00:00.000Z',
        }}
      />,
    )

    expect(
      screen.getByText(translations['flights.no_records_desc']),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('No arrivals scheduled at this time.'),
    ).not.toBeInTheDocument()
  })

  it('renders placeholder rows with a blank scheduled time safely', () => {
    render(
      <FlightBoard
        data={{
          boardType: 'departures',
          configured: true,
          providerLabel: 'AirLabs',
          message: '1 departures found.',
          records: [
            {
              id: 'placeholder-departures-manual-1',
              airline: 'MK',
              flightNumber: 'MK121',
              route: 'MRU',
              scheduledTime: '',
              estimatedTime: null,
              remarks: 'Awaiting Pair',
              lastUpdated: null,
            },
          ],
          degraded: false,
          fetchedAt: '2026-04-09T10:00:00.000Z',
        }}
      />,
    )

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Awaiting Pair').length).toBeGreaterThan(0)
  })
})
