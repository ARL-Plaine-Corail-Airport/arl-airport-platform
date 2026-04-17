import { afterEach, describe, expect, it, vi } from 'vitest'

type ManualFlightDoc = {
  id: string
  airline: string
  flightNumber: string | null
  route: string
  scheduledTime: string
  estimatedTime?: string | null
  remarks: string
  updatedAt?: string | null
}

type SetupOptions = {
  providerArrivals?: Array<Record<string, unknown>>
  providerDepartures?: Array<Record<string, unknown>>
  manualArrivals?: ManualFlightDoc[]
  manualDepartures?: ManualFlightDoc[]
  dayRange?: {
    startOfDay: string
    endOfDay: string
  }
  envOverrides?: Partial<{
    flightProviderApiKey: string
    flightProviderIataCode: string
    flightProviderEndpoint: string
    flightProviderAirlineFilter: string
  }>
}

function setupFlightRuntime(options: SetupOptions = {}) {
  const {
    providerArrivals = [],
    providerDepartures = [],
    manualArrivals = [],
    manualDepartures = [],
    dayRange = {
      startOfDay: '2026-04-13T00:00:00.000Z',
      endOfDay: '2026-04-13T23:59:59.999Z',
    },
    envOverrides = {},
  } = options

  const fetchMock = vi.fn(async (input: string) => {
    const requestUrl = new URL(input)
    const isArrivals = requestUrl.searchParams.has('arr_iata')

    return {
      ok: true,
      json: async () => ({
        response: isArrivals ? providerArrivals : providerDepartures,
      }),
    }
  })

  const findMock = vi.fn(async ({ where }: any) => {
    const boardTypeFilter = where.and.find((condition: any) => condition.boardType)?.boardType?.equals

    return {
      docs: boardTypeFilter === 'arrival' ? manualArrivals : manualDepartures,
    }
  })

  vi.doMock('@/lib/build-db', () => ({
    shouldSkipDbDuringBuild: () => false,
    isBuildTimeDbDisabledError: () => false,
  }))

  vi.doMock('@/lib/date', () => ({
    getMauritiusDayRange: () => ({
      ...dayRange,
    }),
  }))

  vi.doMock('@/lib/env', () => ({
    env: {
      flightProviderLabel: 'AirLabs',
    },
    serverEnv: {
      flightProviderApiKey: 'key',
      flightProviderIataCode: 'RRG',
      flightProviderEndpoint: 'https://airlabs.example',
      flightProviderAirlineFilter: '',
      ...envOverrides,
    },
  }))

  vi.doMock('@/lib/logger', () => ({
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
    },
  }))

  vi.doMock('@/lib/payload', () => ({
    getPayloadClient: vi.fn(async () => ({
      find: findMock,
    })),
  }))

  vi.stubGlobal('fetch', fetchMock)

  return { fetchMock, findMock }
}

describe('flight board runtime reconciliation', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reconciles same-day provider rotations into equal board counts from one snapshot', async () => {
    const { fetchMock } = setupFlightRuntime({
      providerArrivals: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK120',
          dep_iata: 'MRU',
          arr_iata: 'RRG',
          arr_time: '2026-04-13T10:00:00.000Z',
          status: 'scheduled',
        },
        {
          airline_iata: 'MK',
          flight_iata: 'MK126',
          dep_iata: 'MRU',
          arr_iata: 'RRG',
          arr_time: '2026-04-13T13:15:00.000Z',
          status: 'scheduled',
        },
      ],
      providerDepartures: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK121',
          dep_iata: 'RRG',
          arr_iata: 'MRU',
          dep_time: '2026-04-13T11:00:00.000Z',
          status: 'scheduled',
        },
        {
          airline_iata: 'MK',
          flight_iata: 'MK127',
          dep_iata: 'RRG',
          arr_iata: 'MRU',
          dep_time: '2026-04-13T14:05:00.000Z',
          status: 'scheduled',
        },
      ],
    })

    const { getFlightBoards } = await import('@/lib/integrations/flights')
    const boards = await getFlightBoards()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(boards.arrivals.records.map((record) => record.flightNumber)).toEqual([
      'MK120',
      'MK126',
    ])
    expect(boards.departures.records.map((record) => record.flightNumber)).toEqual([
      'MK121',
      'MK127',
    ])
    expect(boards.arrivals.records).toHaveLength(boards.departures.records.length)
  })

  it('pairs a previous-night arrival with a same-day departure inside the 2-hour window', async () => {
    setupFlightRuntime({
      providerArrivals: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK120',
          dep_iata: 'MRU',
          arr_iata: 'RRG',
          arr_time: '2026-04-12T23:30:00.000Z',
          status: 'landed',
        },
      ],
      providerDepartures: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK121',
          dep_iata: 'RRG',
          arr_iata: 'MRU',
          dep_time: '2026-04-13T00:45:00.000Z',
          status: 'scheduled',
        },
      ],
    })

    const { getFlightBoards } = await import('@/lib/integrations/flights')
    const boards = await getFlightBoards()

    expect(boards.arrivals.records).toHaveLength(1)
    expect(boards.departures.records).toHaveLength(1)
    expect(boards.arrivals.records[0]).toEqual(
      expect.objectContaining({
        flightNumber: 'MK120',
        scheduledTime: '2026-04-12T23:30:00.000Z',
      }),
    )
    expect(boards.departures.records[0]).toEqual(
      expect.objectContaining({
        flightNumber: 'MK121',
        scheduledTime: '2026-04-13T00:45:00.000Z',
      }),
    )
  })

  it('creates a placeholder departure when an arrival has no paired leg', async () => {
    setupFlightRuntime({
      providerArrivals: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK126',
          dep_iata: 'MRU',
          arr_iata: 'RRG',
          arr_time: '2026-04-13T13:15:00.000Z',
          status: 'scheduled',
        },
      ],
      providerDepartures: [],
    })

    const { getFlightBoards } = await import('@/lib/integrations/flights')
    const boards = await getFlightBoards()

    expect(boards.arrivals.records).toHaveLength(1)
    expect(boards.departures.records).toHaveLength(1)
    expect(boards.departures.records[0]).toEqual(
      expect.objectContaining({
        flightNumber: 'MK127',
        route: 'MRU',
        scheduledTime: '',
        estimatedTime: null,
        remarks: 'Awaiting Pair',
      }),
    )
  })

  it('lets a manual departure override the provider departure for the paired leg', async () => {
    setupFlightRuntime({
      providerArrivals: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK120',
          dep_iata: 'MRU',
          arr_iata: 'RRG',
          arr_time: '2026-04-13T10:00:00.000Z',
          status: 'scheduled',
        },
      ],
      providerDepartures: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK121',
          dep_iata: 'RRG',
          arr_iata: 'MRU',
          dep_time: '2026-04-13T11:00:00.000Z',
          status: 'scheduled',
        },
      ],
      manualDepartures: [
        {
          id: '1',
          airline: 'MK',
          flightNumber: 'MK121',
          route: 'MRU',
          scheduledTime: '2026-04-13T11:15:00.000Z',
          estimatedTime: '2026-04-13T11:40:00.000Z',
          remarks: 'Delayed',
          updatedAt: '2026-04-13T10:30:00.000Z',
        },
      ],
    })

    const { getFlightBoards } = await import('@/lib/integrations/flights')
    const boards = await getFlightBoards()

    expect(boards.arrivals.records).toHaveLength(1)
    expect(boards.departures.records).toHaveLength(1)
    expect(boards.departures.records[0]).toEqual(
      expect.objectContaining({
        id: 'manual-1',
        flightNumber: 'MK121',
        scheduledTime: '2026-04-13T11:15:00.000Z',
        estimatedTime: '2026-04-13T11:40:00.000Z',
        remarks: 'Delayed',
        lastUpdated: '2026-04-13T10:30:00.000Z',
      }),
    )
  })

  it('encodes both AirLabs requests with URLSearchParams', async () => {
    const { fetchMock } = setupFlightRuntime({
      envOverrides: {
        flightProviderApiKey: 'key&special=value',
        flightProviderIataCode: 'RRG?unsafe=true',
        flightProviderAirlineFilter: 'MK&override=no',
      },
    })

    const { getFlightBoards } = await import('@/lib/integrations/flights')
    await getFlightBoards()

    const urls = fetchMock.mock.calls.map(([input]) => new URL(input as string))
    const arrivalsRequest = urls.find((url) => url.searchParams.has('arr_iata'))
    const departuresRequest = urls.find((url) => url.searchParams.has('dep_iata'))

    expect(arrivalsRequest?.searchParams.get('arr_iata')).toBe('RRG?unsafe=true')
    expect(departuresRequest?.searchParams.get('dep_iata')).toBe('RRG?unsafe=true')
    expect(arrivalsRequest?.searchParams.get('airline_iata')).toBe('MK&override=no')
    expect(departuresRequest?.searchParams.get('airline_iata')).toBe('MK&override=no')
    expect(arrivalsRequest?.searchParams.get('api_key')).toBe('key&special=value')
    expect(departuresRequest?.searchParams.get('api_key')).toBe('key&special=value')
  })

  it('falls back to a real-time window when the Mauritius day range cannot be parsed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13T12:00:00.000Z'))

    setupFlightRuntime({
      dayRange: {
        startOfDay: 'not-a-date',
        endOfDay: 'also-not-a-date',
      },
      providerArrivals: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK200',
          dep_iata: 'MRU',
          arr_iata: 'RRG',
          arr_time: '2026-04-13T11:30:00.000Z',
          status: 'scheduled',
        },
      ],
      providerDepartures: [
        {
          airline_iata: 'MK',
          flight_iata: 'MK201',
          dep_iata: 'RRG',
          arr_iata: 'MRU',
          dep_time: '2026-04-13T12:30:00.000Z',
          status: 'scheduled',
        },
      ],
    })

    const { getFlightBoards } = await import('@/lib/integrations/flights')
    const boards = await getFlightBoards()

    expect(boards.arrivals.records).toEqual([
      expect.objectContaining({
        flightNumber: 'MK200',
        scheduledTime: '2026-04-13T11:30:00.000Z',
      }),
    ])
    expect(boards.departures.records).toEqual([
      expect.objectContaining({
        flightNumber: 'MK201',
        scheduledTime: '2026-04-13T12:30:00.000Z',
      }),
    ])
  })
})
