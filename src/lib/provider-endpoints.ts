const DEFAULT_FLIGHT_PROVIDER_BASE_URL = 'https://airlabs.co/api/v9'
const DEFAULT_WEATHER_PROVIDER_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

function readProviderBaseUrl(name: string, fallback: string): string {
  const value = process.env[name]?.trim() || fallback

  try {
    const url = new URL(value)
    const allowsHttp = process.env.NODE_ENV !== 'production'

    if (url.protocol === 'https:' || (allowsHttp && url.protocol === 'http:')) {
      return value
    }
  } catch {
    throw new Error(`${name} must be a valid URL.`)
  }

  throw new Error(
    `${name} must use https:${process.env.NODE_ENV === 'production' ? '' : ' or http: in non-production'}.`,
  )
}

export function getConfiguredFlightProviderBaseUrl(): string {
  return readProviderBaseUrl('FLIGHT_PROVIDER_ENDPOINT', DEFAULT_FLIGHT_PROVIDER_BASE_URL)
}

export function getConfiguredWeatherProviderBaseUrl(): string {
  return readProviderBaseUrl('WEATHER_PROVIDER_ENDPOINT', DEFAULT_WEATHER_PROVIDER_BASE_URL)
}
