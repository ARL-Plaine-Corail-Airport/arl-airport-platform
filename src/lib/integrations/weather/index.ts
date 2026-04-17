import 'server-only'

import { cache } from 'react'

import { env } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import { logger } from '@/lib/logger'
import type { WeatherResponse } from './types'

type OpenMeteoCurrent = {
  temperature_2m?: number
  visibility?: number
  weather_code?: number
  wind_gusts_10m?: number
}

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Light snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function describeWeatherCode(code?: number | null) {
  if (typeof code !== 'number') {
    return 'Current conditions available'
  }

  return WEATHER_CODE_LABELS[code] || 'Current conditions available'
}

function buildPassengerAdvisory(input: {
  visibilityKm: number | null
  weatherCode?: number | null
  windGustsKmh?: number | null
}) {
  const { visibilityKm, weatherCode, windGustsKmh } = input

  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return 'Thunderstorm conditions in the area'
  }

  if (visibilityKm !== null && visibilityKm < 5) {
    return 'Reduced visibility around the airport'
  }

  if (windGustsKmh !== null && windGustsKmh !== undefined && windGustsKmh >= 50) {
    return 'Strong wind gusts reported'
  }

  if (weatherCode === 65 || weatherCode === 82) {
    return 'Heavy rain may affect passenger movement'
  }

  return null
}

function buildRequestUrl() {
  const url = new URL(serverEnv.weatherProviderEndpoint)

  url.searchParams.set('latitude', String(serverEnv.weatherProviderLatitude))
  url.searchParams.set('longitude', String(serverEnv.weatherProviderLongitude))
  url.searchParams.set(
    'current',
    'temperature_2m,weather_code,visibility,wind_gusts_10m',
  )
  url.searchParams.set('timezone', serverEnv.weatherProviderTimezone)

  return url
}

export const getWeatherSnapshot = cache(async (): Promise<WeatherResponse> => {
  try {
    const response = await fetch(buildRequestUrl(), {
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
      next: {
        revalidate: 300,
      },
    })

    if (!response.ok) {
      throw new Error(`Weather provider request failed with ${response.status}`)
    }

    const payload = (await response.json()) as OpenMeteoResponse
    const current = payload.current

    if (!current) {
      throw new Error('Weather provider response is missing current conditions')
    }

    const temperatureC =
      typeof current.temperature_2m === 'number'
        ? round(current.temperature_2m, 1)
        : null
    const visibilityKm =
      typeof current.visibility === 'number'
        ? round(current.visibility / 1000, 1)
        : null
    const weatherCode =
      typeof current.weather_code === 'number'
        ? current.weather_code
        : null
    const windGustsKmh =
      typeof current.wind_gusts_10m === 'number'
        ? round(current.wind_gusts_10m, 1)
        : null

    return {
      configured: true,
      providerLabel: env.weatherProviderLabel,
      fetchedAt: new Date().toISOString(),
      summary: describeWeatherCode(weatherCode),
      visibility: visibilityKm,
      temperatureC,
      warning: buildPassengerAdvisory({
        visibilityKm,
        weatherCode,
        windGustsKmh,
      }),
    }
  } catch (error) {
    logger.error('Failed to fetch weather snapshot', error, 'weather')
    return {
      configured: true,
      providerLabel: env.weatherProviderLabel,
      fetchedAt: null,
      summary: 'Live weather is temporarily unavailable.',
      visibility: null,
      temperatureC: null,
      warning: null,
    }
  }
})
