import { NextResponse } from 'next/server'

import { cachedFetch } from '@/lib/cache'
import { getWeatherSnapshot } from '@/lib/integrations/weather'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await cachedFetch('weather:snapshot', 300, () => getWeatherSnapshot(), {
      shouldCache: (data) => data.fetchedAt !== null,
    })

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': payload.fetchedAt
          ? 'public, s-maxage=300, stale-while-revalidate=600'
          : 'no-store',
      },
    })
  } catch (error) {
    logger.error('Failed to fetch weather snapshot', error, 'weather')
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
