import { cache } from 'react'

import { env, serverEnv } from '@/lib/env'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import type { FlightBoardResponse, FlightBoardType, FlightRecord } from './types'

// ─── AirLabs API response shape ─────────────────────────────────────────────

type AirLabsFlight = {
  airline_iata?: string
  airline_icao?: string
  flight_number?: string
  flight_iata?: string
  dep_iata?: string
  arr_iata?: string
  dep_time?: string
  dep_estimated?: string
  dep_actual?: string
  arr_time?: string
  arr_estimated?: string
  arr_actual?: string
  status?: string
  dep_delayed?: number
  arr_delayed?: number
  duration?: number
}

type AirLabsResponse = {
  response?: AirLabsFlight[]
  error?: { message: string; code: string }
}

// ─── Status mapping ─────────────────────────────────────────────────────────

function mapRemarks(flight: AirLabsFlight, boardType: FlightBoardType): string {
  const status = flight.status?.toLowerCase() ?? ''
  const delayMinutes =
    boardType === 'arrivals' ? flight.arr_delayed : flight.dep_delayed

  if (status === 'cancelled') return 'Cancelled'
  if (status === 'diverted') return 'Diverted'
  if (status === 'incident') return 'Incident'
  if (status === 'landed') return 'Landed'

  if (status === 'active') {
    if (boardType === 'departures') return 'Departed'
    return 'En Route'
  }

  if (delayMinutes && delayMinutes > 0) {
    return `Delayed (${delayMinutes}min)`
  }

  if (status === 'scheduled') return 'On Time'

  return 'Scheduled'
}

function mapFlightRecord(
  flight: AirLabsFlight,
  boardType: FlightBoardType,
  index: number,
): FlightRecord {
  const isArrivals = boardType === 'arrivals'

  const route = isArrivals
    ? flight.dep_iata ?? '—'
    : flight.arr_iata ?? '—'

  const scheduledTime = isArrivals
    ? flight.arr_time ?? ''
    : flight.dep_time ?? ''

  const estimatedTime = isArrivals
    ? flight.arr_estimated ?? flight.arr_actual ?? null
    : flight.dep_estimated ?? flight.dep_actual ?? null

  return {
    id: flight.flight_iata ?? `flight-${index}`,
    airline: flight.airline_iata ?? flight.airline_icao ?? '—',
    flightNumber: flight.flight_iata ?? flight.flight_number ?? '—',
    route,
    scheduledTime,
    estimatedTime,
    remarks: mapRemarks(flight, boardType),
    lastUpdated: null,
  }
}

// ─── AirLabs API call ───────────────────────────────────────────────────────

async function fetchFromAirLabs(
  boardType: FlightBoardType,
): Promise<AirLabsFlight[]> {
  const apiKey = serverEnv.flightProviderApiKey
  if (!apiKey) return []

  const iataCode = serverEnv.flightProviderIataCode
  const baseUrl = serverEnv.flightProviderEndpoint

  const param = boardType === 'arrivals' ? 'arr_iata' : 'dep_iata'
  const airlineFilter = serverEnv.flightProviderAirlineFilter
  const url = `${baseUrl}/schedules?${param}=${iataCode}${airlineFilter ? `&airline_iata=${airlineFilter}` : ''}&api_key=${apiKey}`

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 120 },
  })

  if (!response.ok) {
    throw new Error(`AirLabs API returned ${response.status}`)
  }

  const data = (await response.json()) as AirLabsResponse

  if (data.error) {
    throw new Error(`AirLabs error: ${data.error.message}`)
  }

  return data.response ?? []
}

// ─── CMS manual flights ────────────────────────────────────────────────────

async function fetchManualFlights(
  boardType: FlightBoardType,
): Promise<FlightRecord[]> {
  try {
    const payload = await getPayloadClient()

    // Get today's date range (local timezone)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const result = await payload.find({
      collection: 'flights',
      limit: 50,
      where: {
        and: [
          { status: { equals: 'active' } },
          { boardType: { equals: boardType === 'arrivals' ? 'arrival' : 'departure' } },
          { scheduledTime: { greater_than_equal: startOfDay.toISOString() } },
          { scheduledTime: { less_than: endOfDay.toISOString() } },
        ],
      },
      sort: 'scheduledTime',
    })

    return result.docs.map((doc: any) => ({
      id: `manual-${doc.id}`,
      airline: doc.airline,
      flightNumber: doc.flightNumber,
      route: doc.route,
      scheduledTime: doc.scheduledTime,
      estimatedTime: doc.estimatedTime ?? null,
      remarks: doc.remarks,
      lastUpdated: doc.updatedAt ?? null,
    }))
  } catch (error) {
    logger.error('Failed to fetch manual flights', error, 'flights')
    return []
  }
}

// ─── Merge: CMS overrides API by flight number ─────────────────────────────

function mergeFlights(
  apiRecords: FlightRecord[],
  manualRecords: FlightRecord[],
): FlightRecord[] {
  // Build a set of flight numbers from manual entries
  const manualFlightNumbers = new Set(
    manualRecords.map((r) => r.flightNumber.toUpperCase()),
  )

  // Keep API records that are NOT overridden by manual entries
  const filtered = apiRecords.filter(
    (r) => !manualFlightNumbers.has(r.flightNumber.toUpperCase()),
  )

  // Combine and sort by scheduled time
  const merged = [...filtered, ...manualRecords]
  merged.sort((a, b) =>
    (a.scheduledTime || '').localeCompare(b.scheduledTime || ''),
  )

  return merged
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const getFlightBoard = cache(
  async (boardType: FlightBoardType): Promise<FlightBoardResponse> => {
    try {
      // Fetch from both sources in parallel
      const [apiFlights, manualRecords] = await Promise.all([
        serverEnv.flightProviderApiKey
          ? fetchFromAirLabs(boardType)
          : Promise.resolve([]),
        fetchManualFlights(boardType),
      ])

      const apiRecords = apiFlights.map((f, i) =>
        mapFlightRecord(f, boardType, i),
      )

      const records = mergeFlights(apiRecords, manualRecords)

      const configured =
        !!serverEnv.flightProviderApiKey || manualRecords.length > 0

      return {
        configured,
        providerLabel: env.flightProviderLabel,
        boardType,
        fetchedAt: new Date().toISOString(),
        message: records.length
          ? `${records.length} ${boardType} found.`
          : configured
            ? `No ${boardType} scheduled at this time.`
            : 'Flight data is not configured. Set FLIGHT_PROVIDER_API_KEY or add manual flights in the CMS.',
        records,
      }
    } catch (error) {
      // API failed — still try manual entries
      const manualRecords = await fetchManualFlights(boardType)

      if (manualRecords.length > 0) {
        return {
          configured: true,
          providerLabel: env.flightProviderLabel,
          boardType,
          fetchedAt: new Date().toISOString(),
          message: `${manualRecords.length} ${boardType} found (manual entries only — live feed unavailable).`,
          records: manualRecords,
        }
      }

      const msg = error instanceof Error ? error.message : 'Unknown error'
      return {
        configured: true,
        providerLabel: env.flightProviderLabel,
        boardType,
        fetchedAt: new Date().toISOString(),
        message: `Unable to fetch flight data: ${msg}`,
        records: [],
      }
    }
  },
)
