import 'server-only'

import { createHash } from 'crypto'

import { cache } from 'react'

import { isBuildTimeDbDisabledError, shouldSkipDbDuringBuild } from '@/lib/build-db'
import { getMauritiusDayRange } from '@/lib/date'
import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { redactSensitiveText } from '@/lib/redaction'
import type { Flight } from '@/payload-types'
import type { FlightBoardResponse, FlightBoardType, FlightRecord } from './types'

const CROSS_MIDNIGHT_WINDOW_MS = 2 * 60 * 60 * 1000
const PLACEHOLDER_REMARKS = 'Awaiting Pair'

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

type FlightWindow = {
  startOfDay: string
  endOfDay: string
  startOfDayMs: number
  endOfDayMs: number
  windowStart: string
  windowEnd: string
  windowStartMs: number
  windowEndMs: number
}

type InternalFlightRecord = FlightRecord & {
  sortTime: string
}

type FlightCandidate = InternalFlightRecord & {
  boardType: FlightBoardType
  scheduledAtMs: number | null
  withinDay: boolean
  rotationKey: string | null
  counterpartFlightNumber: string | null
}

type FlightBoardsSnapshot = {
  configured: boolean
  providerLabel: string
  fetchedAt: string
  degraded?: boolean
  providerFailureCount: number
  errorMessage?: string
  arrivals: InternalFlightRecord[]
  departures: InternalFlightRecord[]
}

export type FlightBoardsResult = {
  arrivals: FlightBoardResponse
  departures: FlightBoardResponse
  degraded?: boolean
}

type ParsedFlightNumber = {
  airline: string
  sequence: number
  width: number
}

function parseTimestamp(value?: string | null): number | null {
  if (!value) return null

  const instant = Date.parse(value)
  return Number.isNaN(instant) ? null : instant
}

function isWithinWindow(
  instantMs: number | null,
  startMs: number,
  endMs: number,
): boolean {
  return instantMs !== null && instantMs >= startMs && instantMs <= endMs
}

function getFlightWindow(): FlightWindow {
  const { startOfDay, endOfDay } = getMauritiusDayRange()
  const parsedStartOfDayMs = Date.parse(startOfDay)
  const parsedEndOfDayMs = Date.parse(endOfDay)
  const fallbackStartOfDayMs =
    Math.floor(Date.now() / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000
  const fallbackEndOfDayMs = fallbackStartOfDayMs + 24 * 60 * 60 * 1000 - 1
  const startOfDayMs = Number.isNaN(parsedStartOfDayMs)
    ? fallbackStartOfDayMs
    : parsedStartOfDayMs
  const endOfDayMs = Number.isNaN(parsedEndOfDayMs)
    ? fallbackEndOfDayMs
    : parsedEndOfDayMs
  const windowStartMs = startOfDayMs - CROSS_MIDNIGHT_WINDOW_MS
  const windowEndMs = endOfDayMs + CROSS_MIDNIGHT_WINDOW_MS

  return {
    startOfDay,
    endOfDay,
    startOfDayMs,
    endOfDayMs,
    windowStart: new Date(windowStartMs).toISOString(),
    windowEnd: new Date(windowEndMs).toISOString(),
    windowStartMs,
    windowEndMs,
  }
}

function getProviderScheduledTime(
  flight: AirLabsFlight,
  boardType: FlightBoardType,
): string | undefined {
  return boardType === 'arrivals' ? flight.arr_time : flight.dep_time
}

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

function toInternalRecord(
  record: FlightRecord,
  sortTime = record.scheduledTime,
): InternalFlightRecord {
  return {
    ...record,
    sortTime,
  }
}

function mapFlightRecord(
  flight: AirLabsFlight,
  boardType: FlightBoardType,
  index: number,
): InternalFlightRecord {
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

  return toInternalRecord({
    id: flight.flight_iata ?? `flight-${index}`,
    airline: flight.airline_iata ?? flight.airline_icao ?? '—',
    flightNumber: flight.flight_iata ?? flight.flight_number ?? '—',
    route,
    scheduledTime,
    estimatedTime,
    remarks: mapRemarks(flight, boardType),
    lastUpdated: null,
  })
}

function normalizeFlightNumber(value?: string | null): string {
  return (value ?? '').toUpperCase().replace(/\s+/g, '')
}

function parseFlightNumber(
  airline: string,
  flightNumber: string,
): ParsedFlightNumber | null {
  const normalizedAirline = (airline ?? '').trim().toUpperCase()
  const normalizedFlightNumber = normalizeFlightNumber(flightNumber)
  const fallbackAirline =
    normalizedFlightNumber.match(/^[A-Z0-9]{2,3}/)?.[0] ?? ''
  const digits = normalizedFlightNumber.match(/(\d+)/)?.[1]
  const sequence = digits ? Number.parseInt(digits, 10) : Number.NaN
  const airlineCode = normalizedAirline || fallbackAirline

  if (!airlineCode || !digits || Number.isNaN(sequence)) {
    return null
  }

  return {
    airline: airlineCode,
    sequence,
    width: digits.length,
  }
}

function formatFlightNumber(
  airline: string,
  sequence: number,
  width: number,
): string | null {
  if (sequence < 0) return null
  return `${airline}${String(sequence).padStart(width, '0')}`
}

function getRotationMetadata(
  airline: string,
  flightNumber: string,
  boardType: FlightBoardType,
): { rotationKey: string | null; counterpartFlightNumber: string | null } {
  const parsed = parseFlightNumber(airline, flightNumber)
  if (!parsed) {
    return { rotationKey: null, counterpartFlightNumber: null }
  }

  const rotationSequence =
    boardType === 'arrivals' ? parsed.sequence : parsed.sequence - 1
  if (rotationSequence < 0) {
    return { rotationKey: null, counterpartFlightNumber: null }
  }

  const counterpartSequence =
    boardType === 'arrivals' ? parsed.sequence + 1 : parsed.sequence - 1

  return {
    rotationKey: `${parsed.airline}:${rotationSequence}`,
    counterpartFlightNumber:
      counterpartSequence < 0
        ? null
        : formatFlightNumber(parsed.airline, counterpartSequence, parsed.width),
  }
}

async function fetchFromAirLabs(
  boardType: FlightBoardType,
  flightWindow: FlightWindow,
): Promise<AirLabsFlight[]> {
  const apiKey = serverEnv.flightProviderApiKey
  if (!apiKey) return []

  const iataCode = serverEnv.flightProviderIataCode
  const baseUrl = serverEnv.flightProviderEndpoint
  const param = boardType === 'arrivals' ? 'arr_iata' : 'dep_iata'
  const airlineFilter = serverEnv.flightProviderAirlineFilter
  const airlineFilters = airlineFilter
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean)
  const allowedAirlines = airlineFilters.length > 0
    ? new Set(airlineFilters.map((code) => code.toUpperCase()))
    : null
  const url = new URL(`${baseUrl}/schedules`)

  url.searchParams.set(param, iataCode)
  if (airlineFilters.length > 0) {
    url.searchParams.set('airline_iata', airlineFilters.join(','))
  }

  const apiId = serverEnv.flightProviderApiId
  if (apiId) {
    // Time-bound signature — expires quickly, so leakage in upstream logs is low-risk.
    // Format per AirLabs docs: api_id:timestamp:md5(timestamp:api_key)
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const digest = createHash('md5').update(`${timestamp}:${apiKey}`).digest('hex')
    url.searchParams.set('signature', `${apiId}:${timestamp}:${digest}`)
  } else {
    url.searchParams.set('api_key', apiKey)
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 2600 },
  })

  if (!response.ok) {
    throw new Error(`AirLabs API returned ${response.status}`)
  }

  const data = (await response.json()) as AirLabsResponse

  if (data.error) {
    throw new Error(`AirLabs error: ${data.error.message}`)
  }

  const flights = data.response ?? []
  const airlineFilteredFlights = !allowedAirlines
    ? flights
    : flights.filter((flight) => {
        const code = (flight.airline_iata ?? flight.airline_icao ?? '').toUpperCase()
        return allowedAirlines.has(code)
      })

  if (
    Number.isNaN(flightWindow.windowStartMs) ||
    Number.isNaN(flightWindow.windowEndMs)
  ) {
    return airlineFilteredFlights
  }

  return airlineFilteredFlights.filter((flight) =>
    isWithinWindow(
      parseTimestamp(getProviderScheduledTime(flight, boardType)),
      flightWindow.windowStartMs,
      flightWindow.windowEndMs,
    ),
  )
}

async function fetchManualFlights(
  boardType: FlightBoardType,
  flightWindow: FlightWindow,
): Promise<InternalFlightRecord[]> {
  if (shouldSkipDbDuringBuild()) {
    return []
  }

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'flights',
      limit: 50,
      where: {
        and: [
          { status: { equals: 'active' } },
          { boardType: { equals: boardType === 'arrivals' ? 'arrival' : 'departure' } },
          { scheduledTime: { greater_than_equal: flightWindow.windowStart } },
          { scheduledTime: { less_than: flightWindow.windowEnd } },
        ],
      },
      sort: 'scheduledTime',
    })

    return (result.docs as Flight[]).map((doc) =>
      toInternalRecord({
        id: `manual-${doc.id}`,
        airline: doc.airline,
        flightNumber: doc.flightNumber,
        route: doc.route,
        scheduledTime: doc.scheduledTime,
        estimatedTime: doc.estimatedTime ?? null,
        remarks: doc.remarks,
        lastUpdated: doc.updatedAt ?? null,
      }),
    )
  } catch (error) {
    if (isBuildTimeDbDisabledError(error)) {
      return []
    }

    logger.error('Failed to fetch manual flights', error, 'flights')
    return []
  }
}

function compareRecords(a: InternalFlightRecord, b: InternalFlightRecord): number {
  const left = a.sortTime || a.scheduledTime || ''
  const right = b.sortTime || b.scheduledTime || ''

  return (
    left.localeCompare(right) ||
    (a.flightNumber || '').localeCompare(b.flightNumber || '') ||
    a.id.localeCompare(b.id)
  )
}

function mergeFlights(
  apiRecords: InternalFlightRecord[],
  manualRecords: InternalFlightRecord[],
): InternalFlightRecord[] {
  const manualFlightNumbers = new Set(
    manualRecords.map((record) => normalizeFlightNumber(record.flightNumber)),
  )

  const filtered = apiRecords.filter(
    (record) => !manualFlightNumbers.has(normalizeFlightNumber(record.flightNumber)),
  )

  return [...filtered, ...manualRecords].sort(compareRecords)
}

function toCandidate(
  record: InternalFlightRecord,
  boardType: FlightBoardType,
  flightWindow: FlightWindow,
): FlightCandidate {
  const scheduledAtMs = parseTimestamp(record.scheduledTime)
  const { rotationKey, counterpartFlightNumber } = getRotationMetadata(
    record.airline,
    record.flightNumber,
    boardType,
  )

  return {
    ...record,
    boardType,
    scheduledAtMs,
    withinDay: isWithinWindow(
      scheduledAtMs,
      flightWindow.startOfDayMs,
      flightWindow.endOfDayMs,
    ),
    rotationKey,
    counterpartFlightNumber,
  }
}

function compareCandidates(a: FlightCandidate, b: FlightCandidate): number {
  const left = a.scheduledAtMs ?? Number.MAX_SAFE_INTEGER
  const right = b.scheduledAtMs ?? Number.MAX_SAFE_INTEGER

  return (
    left - right ||
    (a.flightNumber || '').localeCompare(b.flightNumber || '') ||
    a.id.localeCompare(b.id)
  )
}

function isPairAllowed(
  arrival: FlightCandidate,
  departure: FlightCandidate,
  flightWindow: FlightWindow,
): boolean {
  if (!arrival.rotationKey || arrival.rotationKey !== departure.rotationKey) {
    return false
  }

  if (arrival.scheduledAtMs === null || departure.scheduledAtMs === null) {
    return false
  }

  if (departure.scheduledAtMs < arrival.scheduledAtMs) {
    return false
  }

  if (arrival.withinDay && departure.withinDay) {
    return true
  }

  const isCrossMidnightBeforeDay =
    arrival.scheduledAtMs < flightWindow.startOfDayMs &&
    departure.withinDay &&
    arrival.scheduledAtMs >= flightWindow.startOfDayMs - CROSS_MIDNIGHT_WINDOW_MS

  if (isCrossMidnightBeforeDay) {
    return departure.scheduledAtMs - arrival.scheduledAtMs <= CROSS_MIDNIGHT_WINDOW_MS
  }

  const isCrossMidnightAfterDay =
    arrival.withinDay &&
    departure.scheduledAtMs > flightWindow.endOfDayMs &&
    departure.scheduledAtMs <= flightWindow.endOfDayMs + CROSS_MIDNIGHT_WINDOW_MS

  if (isCrossMidnightAfterDay) {
    return departure.scheduledAtMs - arrival.scheduledAtMs <= CROSS_MIDNIGHT_WINDOW_MS
  }

  return false
}

function pickCandidate(
  candidates: FlightCandidate[],
  usedIds: Set<string>,
  preferredFlightNumber: string | null,
  predicate: (candidate: FlightCandidate) => boolean,
): FlightCandidate | undefined {
  const normalizedPreferred = normalizeFlightNumber(preferredFlightNumber)

  if (normalizedPreferred) {
    const exactMatch = candidates.find(
      (candidate) =>
        !usedIds.has(candidate.id) &&
        normalizeFlightNumber(candidate.flightNumber) === normalizedPreferred &&
        predicate(candidate),
    )

    if (exactMatch) {
      return exactMatch
    }
  }

  return candidates.find(
    (candidate) => !usedIds.has(candidate.id) && predicate(candidate),
  )
}

function createPlaceholder(
  boardType: FlightBoardType,
  counterpart: FlightCandidate,
): InternalFlightRecord {
  return {
    id: `placeholder-${boardType}-${counterpart.id}`,
    airline: counterpart.airline,
    flightNumber:
      counterpart.counterpartFlightNumber ?? counterpart.flightNumber ?? '—',
    route: counterpart.route,
    scheduledTime: '',
    estimatedTime: null,
    remarks: PLACEHOLDER_REMARKS,
    lastUpdated: null,
    sortTime: counterpart.sortTime || counterpart.scheduledTime || '',
  }
}

function reconcileBoards(
  arrivals: InternalFlightRecord[],
  departures: InternalFlightRecord[],
  flightWindow: FlightWindow,
): { arrivals: InternalFlightRecord[]; departures: InternalFlightRecord[] } {
  const arrivalCandidates = arrivals
    .map((record) => toCandidate(record, 'arrivals', flightWindow))
    .sort(compareCandidates)
  const departureCandidates = departures
    .map((record) => toCandidate(record, 'departures', flightWindow))
    .sort(compareCandidates)

  const currentArrivals = arrivalCandidates.filter((candidate) => candidate.withinDay)
  const currentDepartures = departureCandidates.filter((candidate) => candidate.withinDay)
  const previousArrivals = arrivalCandidates
    .filter(
      (candidate) =>
        candidate.scheduledAtMs !== null &&
        candidate.scheduledAtMs < flightWindow.startOfDayMs &&
        candidate.scheduledAtMs >= flightWindow.startOfDayMs - CROSS_MIDNIGHT_WINDOW_MS,
    )
    .sort((a, b) => compareCandidates(b, a))
  const nextDepartures = departureCandidates.filter(
    (candidate) =>
      candidate.scheduledAtMs !== null &&
      candidate.scheduledAtMs > flightWindow.endOfDayMs &&
      candidate.scheduledAtMs <= flightWindow.endOfDayMs + CROSS_MIDNIGHT_WINDOW_MS,
  )

  const usedArrivalIds = new Set<string>()
  const usedDepartureIds = new Set<string>()
  const reconciledArrivals: InternalFlightRecord[] = []
  const reconciledDepartures: InternalFlightRecord[] = []

  for (const arrival of currentArrivals) {
    if (usedArrivalIds.has(arrival.id)) continue

    const departure = pickCandidate(
      [...currentDepartures, ...nextDepartures],
      usedDepartureIds,
      arrival.counterpartFlightNumber,
      (candidate) => isPairAllowed(arrival, candidate, flightWindow),
    )

    usedArrivalIds.add(arrival.id)
    reconciledArrivals.push(arrival)

    if (departure) {
      usedDepartureIds.add(departure.id)
      reconciledDepartures.push(departure)
      continue
    }

    reconciledDepartures.push(createPlaceholder('departures', arrival))
  }

  for (const departure of currentDepartures) {
    if (usedDepartureIds.has(departure.id)) continue

    const arrival = pickCandidate(
      previousArrivals,
      usedArrivalIds,
      departure.counterpartFlightNumber,
      (candidate) => isPairAllowed(candidate, departure, flightWindow),
    )

    usedDepartureIds.add(departure.id)
    reconciledDepartures.push(departure)

    if (arrival) {
      usedArrivalIds.add(arrival.id)
      reconciledArrivals.push(arrival)
      continue
    }

    reconciledArrivals.push(createPlaceholder('arrivals', departure))
  }

  reconciledArrivals.sort(compareRecords)
  reconciledDepartures.sort(compareRecords)

  return {
    arrivals: reconciledArrivals,
    departures: reconciledDepartures,
  }
}

function toPublicRecord(record: InternalFlightRecord): FlightRecord {
  return {
    id: record.id,
    airline: record.airline,
    flightNumber: record.flightNumber,
    route: record.route,
    scheduledTime: record.scheduledTime,
    estimatedTime: record.estimatedTime ?? null,
    remarks: record.remarks,
    lastUpdated: record.lastUpdated ?? null,
  }
}

function buildBoardMessage(
  snapshot: FlightBoardsSnapshot,
  boardType: FlightBoardType,
  records: FlightRecord[],
): string {
  if (snapshot.degraded) {
    if (records.length > 0) {
      return snapshot.providerFailureCount >= 2
        ? `${records.length} ${boardType} found (manual entries only — live feed unavailable).`
        : `${records.length} ${boardType} found (live feed partially unavailable).`
    }

    if (snapshot.errorMessage) {
      return `Unable to fetch flight data: ${snapshot.errorMessage}`
    }

    return 'Unable to fetch flight data: Live feed unavailable.'
  }

  if (records.length > 0) {
    return `${records.length} ${boardType} found.`
  }

  if (snapshot.configured) {
    return `No ${boardType} scheduled at this time.`
  }

  return 'Flight data is not configured. Set FLIGHT_PROVIDER_API_KEY or add manual flights in the CMS.'
}

function buildFlightBoardResponse(
  snapshot: FlightBoardsSnapshot,
  boardType: FlightBoardType,
): FlightBoardResponse {
  const records = (boardType === 'arrivals'
    ? snapshot.arrivals
    : snapshot.departures
  ).map(toPublicRecord)

  return {
    configured: snapshot.configured,
    providerLabel: snapshot.providerLabel,
    boardType,
    fetchedAt: snapshot.fetchedAt,
    message: buildBoardMessage(snapshot, boardType, records),
    records,
    degraded: snapshot.degraded,
  }
}

const getFlightBoardsSnapshot = cache(async (): Promise<FlightBoardsSnapshot> => {
  const flightWindow = getFlightWindow()

  const providerResults = await Promise.allSettled([
    serverEnv.flightProviderApiKey
      ? fetchFromAirLabs('arrivals', flightWindow)
      : Promise.resolve([]),
    serverEnv.flightProviderApiKey
      ? fetchFromAirLabs('departures', flightWindow)
      : Promise.resolve([]),
  ])
  const manualResults = await Promise.allSettled([
    fetchManualFlights('arrivals', flightWindow),
    fetchManualFlights('departures', flightWindow),
  ])

  const [providerArrivalsResult, providerDeparturesResult] = providerResults
  const [manualArrivalsResult, manualDeparturesResult] = manualResults

  if (manualArrivalsResult.status === 'rejected') {
    logger.error('Unexpected manual arrivals failure', manualArrivalsResult.reason, 'flights')
  }

  if (manualDeparturesResult.status === 'rejected') {
    logger.error('Unexpected manual departures failure', manualDeparturesResult.reason, 'flights')
  }

  const manualArrivals =
    manualArrivalsResult.status === 'fulfilled' ? manualArrivalsResult.value : []
  const manualDepartures =
    manualDeparturesResult.status === 'fulfilled' ? manualDeparturesResult.value : []
  const providerArrivals =
    providerArrivalsResult.status === 'fulfilled' ? providerArrivalsResult.value : []
  const providerDepartures =
    providerDeparturesResult.status === 'fulfilled' ? providerDeparturesResult.value : []

  const providerFailureCount =
    Number(providerArrivalsResult.status === 'rejected') +
    Number(providerDeparturesResult.status === 'rejected')

  if (providerArrivalsResult.status === 'rejected') {
    logger.warn(
      redactSensitiveText(
        `Flight API arrivals fetch failed: ${providerArrivalsResult.reason}`,
        [serverEnv.flightProviderApiKey],
      ),
      'flights',
    )
  }

  if (providerDeparturesResult.status === 'rejected') {
    logger.warn(
      redactSensitiveText(
        `Flight API departures fetch failed: ${providerDeparturesResult.reason}`,
        [serverEnv.flightProviderApiKey],
      ),
      'flights',
    )
  }

  const mergedArrivals = mergeFlights(
    providerArrivals.map((flight, index) => mapFlightRecord(flight, 'arrivals', index)),
    manualArrivals,
  )
  const mergedDepartures = mergeFlights(
    providerDepartures.map((flight, index) => mapFlightRecord(flight, 'departures', index)),
    manualDepartures,
  )
  const reconciled = reconcileBoards(
    mergedArrivals,
    mergedDepartures,
    flightWindow,
  )
  const configured =
    !!serverEnv.flightProviderApiKey ||
    reconciled.arrivals.length > 0 ||
    reconciled.departures.length > 0
  const errorMessage =
    providerArrivalsResult.status === 'rejected'
      ? providerArrivalsResult.reason instanceof Error
        ? redactSensitiveText(providerArrivalsResult.reason.message, [
            serverEnv.flightProviderApiKey,
          ])
        : 'Unknown error'
      : providerDeparturesResult.status === 'rejected'
        ? providerDeparturesResult.reason instanceof Error
          ? redactSensitiveText(providerDeparturesResult.reason.message, [
              serverEnv.flightProviderApiKey,
            ])
          : 'Unknown error'
        : undefined

  return {
    configured,
    providerLabel: serverEnv.flightProviderLabel,
    fetchedAt: new Date().toISOString(),
    degraded: providerFailureCount > 0 || undefined,
    providerFailureCount,
    errorMessage,
    arrivals: reconciled.arrivals,
    departures: reconciled.departures,
  }
})

export const getFlightBoards = cache(async (): Promise<FlightBoardsResult> => {
  const snapshot = await getFlightBoardsSnapshot()

  return {
    arrivals: buildFlightBoardResponse(snapshot, 'arrivals'),
    departures: buildFlightBoardResponse(snapshot, 'departures'),
    degraded: snapshot.degraded,
  }
})

export const getFlightBoard = cache(
  async (boardType: FlightBoardType): Promise<FlightBoardResponse> => {
    const boards = await getFlightBoards()
    return boards[boardType]
  },
)
