import { NextRequest, NextResponse } from 'next/server'

import { getFlightBoard } from '@/lib/integrations/flights'
import type { FlightBoardType } from '@/lib/integrations/flights/types'

export async function GET(request: NextRequest) {
  const boardType = (request.nextUrl.searchParams.get('type') || 'arrivals') as FlightBoardType
  const payload = await getFlightBoard(boardType === 'departures' ? 'departures' : 'arrivals')

  return NextResponse.json(payload)
}
