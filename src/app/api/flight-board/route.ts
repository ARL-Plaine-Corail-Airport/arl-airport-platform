import { NextRequest, NextResponse } from 'next/server'

import { cachedFetch } from '@/lib/cache'
import { getFlightBoards } from '@/lib/integrations/flights'
import { logger } from '@/lib/logger'
import { flightBoardQuerySchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const result = flightBoardQuerySchema.safeParse({
    type: request.nextUrl.searchParams.get('type') ?? undefined,
  })

  if (!result.success) {
    logger.warn(
      `Invalid flight board request: ${JSON.stringify(result.error.flatten())}`,
      'flight-board',
    )
    return NextResponse.json(
      { ok: false, error: 'Invalid request' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }

  const { type: boardType } = result.data

  try {
    const boards = await cachedFetch('flights:rotations', 2600, getFlightBoards, {
      shouldCache: (data) => !data.degraded,
    })
    const payload = boards[boardType]

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: 'Board type unavailable' },
        {
          status: 502,
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      )
    }

    // Redis caches the boards (2600s) and CDN re-caches the response (2600s).
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': boards.degraded
          ? 'no-store'
          : 'public, s-maxage=2600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    logger.error('Failed to fetch flight board', error, 'flight-board')
    return NextResponse.json(
      { ok: false, error: 'Flight data temporarily unavailable', degraded: true },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
