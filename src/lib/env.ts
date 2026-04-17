// =============================================================================
// Typed environment variable access
//
// RULE: NEXT_PUBLIC_ vars are safe for the browser.
//       All others are server-only and must never be imported in client
//       components or passed to the browser via props/serialisation.
// =============================================================================

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : fallback
}

// Weather: this adapter only supports Open-Meteo. The endpoint is
// overridable for self-hosted Open-Meteo instances, but query params
// and response parsing are always Open-Meteo shaped.
const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

// Public (browser-safe)
export const env = {
  // Application
  siteURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Supabase (browser-safe: used to construct public media URLs)
  supabaseURL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // Storage: public bucket name (safe; bucket is public anyway)
  mediaBucket: process.env.SUPABASE_STORAGE_BUCKET_MEDIA || 'arl-public-media',

  // Integration adapters
  flightProviderMode: process.env.FLIGHT_PROVIDER_MODE || 'airlabs',
  flightProviderLabel: process.env.FLIGHT_PROVIDER_LABEL || 'AirLabs',
  weatherProviderMode: 'open-meteo' as const,
  weatherProviderLabel: 'Open-Meteo Forecast API',
} as const

// Server-only
// These are separated to make it obvious they must never reach the client.
// Import this object only in Server Components, API routes, or Payload hooks.

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const serverEnv = {
  // Payload
  payloadSecret: requireEnv('PAYLOAD_SECRET'),

  // Database
  // Production: DATABASE_URL MUST use Supabase pooler (PgBouncer, port 6543)
  // to handle high connection counts across multiple app replicas.
  // DATABASE_DIRECT_URL uses the direct connection (port 5432) for migrations only.
  databaseURL: requireEnv('DATABASE_URL'),
  databaseDirectURL: process.env.DATABASE_DIRECT_URL || '',

  // Supabase server credentials
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Supabase Storage: S3-compatible credentials
  s3AccessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
  s3Endpoint: process.env.SUPABASE_S3_ENDPOINT || '',
  s3Region: process.env.SUPABASE_S3_REGION || 'eu-west-1',

  // Storage bucket names
  mediaBucket: process.env.SUPABASE_STORAGE_BUCKET_MEDIA || 'arl-public-media',
  documentsBucket: process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS || 'arl-protected-docs',

  // Integration endpoints
  flightProviderEndpoint: process.env.FLIGHT_PROVIDER_ENDPOINT || 'https://airlabs.co/api/v9',
  flightProviderApiKey: process.env.FLIGHT_PROVIDER_API_KEY || '',
  flightProviderIataCode: process.env.FLIGHT_PROVIDER_IATA_CODE || 'RRG',
  flightProviderAirlineFilter: process.env.FLIGHT_PROVIDER_AIRLINE_FILTER || '',
  weatherProviderEndpoint: process.env.WEATHER_PROVIDER_ENDPOINT || OPEN_METEO_ENDPOINT,
  // Plaine Corail Airport ARP coordinates from Mauritius AIP AD 2 FIMR.
  weatherProviderLatitude: readNumber(process.env.WEATHER_PROVIDER_LATITUDE, -19.757778),
  weatherProviderLongitude: readNumber(process.env.WEATHER_PROVIDER_LONGITUDE, 63.361389),
  weatherProviderTimezone: process.env.WEATHER_PROVIDER_TIMEZONE || 'Indian/Mauritius',

  // Revalidation
  revalidateSecret: process.env.REVALIDATE_SECRET || '',

  // Redis (Upstash) — required in production for rate limiting and API caching.
  // Optional in development: features degrade gracefully to in-memory fallbacks.
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
} as const
