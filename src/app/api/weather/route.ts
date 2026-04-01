import { NextResponse } from 'next/server'

import { getWeatherSnapshot } from '@/lib/integrations/weather'

export async function GET() {
  const payload = await getWeatherSnapshot()
  return NextResponse.json(payload)
}
