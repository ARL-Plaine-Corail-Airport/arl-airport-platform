export type FlightBoardType = 'arrivals' | 'departures'

export type FlightRecord = {
  id: string
  airline: string
  flightNumber: string
  route: string
  scheduledTime: string
  estimatedTime?: string | null
  remarks: string
  lastUpdated?: string | null
}

export type FlightBoardResponse = {
  configured: boolean
  providerLabel: string
  boardType: FlightBoardType
  fetchedAt?: string | null
  message: string
  records: FlightRecord[]
}
