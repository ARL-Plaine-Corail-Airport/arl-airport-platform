import 'server-only'

import { env } from './env'
import {
  getConfiguredFlightProviderBaseUrl,
  getConfiguredWeatherProviderBaseUrl,
} from './provider-endpoints'

// =============================================================================
// Server-only environment variable access
// =============================================================================

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : fallback
}

function splitAllowedOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function buildSiteOriginAllowList(): string[] {
  return Array.from(new Set([
    process.env.NEXT_PUBLIC_SITE_URL,
    ...splitAllowedOrigins(process.env.NEXT_PUBLIC_SITE_URLS),
    ...splitAllowedOrigins(process.env.ADDITIONAL_ALLOWED_ORIGINS),
  ].filter((origin): origin is string => Boolean(origin))))
}

const BUILD_TIME_UNSET_ENV = '__BUILD_TIME_UNSET__'
const warnedBuildTimeMissingEnv = new Set<string>()

function warnBuildTimeMissingEnv(name: string): void {
  if (warnedBuildTimeMissingEnv.has(name)) return
  warnedBuildTimeMissingEnv.add(name)
  console.warn(
    `[env] Missing required environment variable ${name} during build; using ${BUILD_TIME_UNSET_ENV}.`,
  )
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    // During `next build` (NEXT_OUTPUT_MODE=standalone), placeholder values are
    // acceptable — real secrets are injected at runtime via docker-compose.
    if (process.env.NEXT_OUTPUT_MODE) {
      warnBuildTimeMissingEnv(name)
      return BUILD_TIME_UNSET_ENV
    }
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const visitorHashSalt =
  process.env.NODE_ENV === 'production'
    ? requireEnv('VISITOR_HASH_SALT')
    : process.env.VISITOR_HASH_SALT || 'dev-only-visitor-hash-salt'

const flightProviderBaseUrl = getConfiguredFlightProviderBaseUrl()
const weatherProviderBaseUrl = getConfiguredWeatherProviderBaseUrl()
const siteOriginAllowList = buildSiteOriginAllowList()

export const serverEnv = {
  // Server-side site URL for origin checks and canonical host derivation.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || env.siteURL,
  siteOriginAllowList,

  // Payload
  payloadSecret: requireEnv('PAYLOAD_SECRET'),

  // Database
  // Production: DATABASE_URL MUST use Supabase pooler (PgBouncer, port 6543)
  // to handle high connection counts across multiple app replicas.
  // DATABASE_DIRECT_URL uses the direct connection (port 5432) for migrations only.
  databaseURL: requireEnv('DATABASE_URL'),
  databaseDirectURL: process.env.DATABASE_DIRECT_URL || '',

  // Supabase Storage: S3-compatible credentials
  s3AccessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
  s3Endpoint: process.env.SUPABASE_S3_ENDPOINT || '',
  s3Region: process.env.SUPABASE_S3_REGION || 'eu-west-1',

  // Storage bucket names
  mediaBucket: process.env.SUPABASE_STORAGE_BUCKET_MEDIA || 'arl-public-media',
  documentsBucket: process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS || 'arl-protected-docs',

  // Integration endpoints
  flightProviderMode: process.env.FLIGHT_PROVIDER_MODE || 'airlabs',
  flightProviderLabel: process.env.FLIGHT_PROVIDER_LABEL || 'AirLabs',
  flightProviderEndpoint: flightProviderBaseUrl,
  flightProviderBaseUrl,
  flightProviderApiKey: process.env.FLIGHT_PROVIDER_API_KEY || '',
  // When set alongside FLIGHT_PROVIDER_API_KEY, the AirLabs adapter authenticates
  // with a short-lived signed signature instead of the raw api_key query param,
  // so the long-lived key never appears in upstream access logs.
  flightProviderApiId: process.env.FLIGHT_PROVIDER_API_ID || '',
  flightProviderIataCode: process.env.FLIGHT_PROVIDER_IATA_CODE || 'RRG',
  flightProviderAirlineFilter: process.env.FLIGHT_PROVIDER_AIRLINE_FILTER || '',
  weatherProviderLabel: process.env.WEATHER_PROVIDER_LABEL || 'Open-Meteo Forecast API',
  weatherProviderEndpoint: weatherProviderBaseUrl,
  weatherProviderBaseUrl,
  // Plaine Corail Airport ARP coordinates from Mauritius AIP AD 2 FIMR.
  weatherProviderLatitude: readNumber(process.env.WEATHER_PROVIDER_LATITUDE, -19.757778),
  weatherProviderLongitude: readNumber(process.env.WEATHER_PROVIDER_LONGITUDE, 63.361389),
  weatherProviderTimezone: process.env.WEATHER_PROVIDER_TIMEZONE || 'Indian/Mauritius',

  // Revalidation
  revalidateSecret: process.env.REVALIDATE_SECRET || '',
  statusSecret: process.env.STATUS_SECRET || '',

  // Privacy
  visitorHashSalt,

  // Redis (Upstash) - required in production for rate limiting and API caching.
  // Optional in development: features degrade gracefully to in-memory fallbacks.
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
} as const
