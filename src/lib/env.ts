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

const defaultWeatherProviderEndpoint = 'https://api.open-meteo.com/v1/forecast'
const rawWeatherProviderMode = process.env.WEATHER_PROVIDER_MODE || ''
const rawWeatherProviderLabel = process.env.WEATHER_PROVIDER_LABEL || ''
const rawWeatherProviderEndpoint = process.env.WEATHER_PROVIDER_ENDPOINT || ''

const useDefaultWeatherProvider =
  !rawWeatherProviderEndpoint &&
  (!rawWeatherProviderMode || rawWeatherProviderMode === 'unconfigured')

const resolvedWeatherProviderMode = useDefaultWeatherProvider
  ? 'open-meteo'
  : rawWeatherProviderMode || 'custom'

const resolvedWeatherProviderLabel = useDefaultWeatherProvider
  ? 'Open-Meteo Forecast API'
  : rawWeatherProviderLabel ||
    (resolvedWeatherProviderMode === 'open-meteo'
      ? 'Open-Meteo Forecast API'
      : 'Weather Provider')

const resolvedWeatherProviderEndpoint =
  rawWeatherProviderEndpoint || defaultWeatherProviderEndpoint

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
  weatherProviderMode: resolvedWeatherProviderMode,
  weatherProviderLabel: resolvedWeatherProviderLabel,
} as const

// Server-only
// These are separated to make it obvious they must never reach the client.
// Import this object only in Server Components, API routes, or Payload hooks.
export const serverEnv = {
  // Payload
  payloadSecret: process.env.PAYLOAD_SECRET || '',

  // Database
  databaseURL: process.env.DATABASE_URL || '',
  databaseDirectURL: process.env.DATABASE_DIRECT_URL || '',

  // Supabase server credentials
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Supabase Storage: S3-compatible credentials
  s3AccessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
  s3Endpoint: process.env.SUPABASE_S3_ENDPOINT || '',
  s3Region: process.env.SUPABASE_S3_REGION || 'ap-southeast-1',

  // Storage bucket names
  mediaBucket: process.env.SUPABASE_STORAGE_BUCKET_MEDIA || 'arl-public-media',
  documentsBucket: process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS || 'arl-protected-docs',

  // Integration endpoints
  flightProviderEndpoint: process.env.FLIGHT_PROVIDER_ENDPOINT || 'https://airlabs.co/api/v9',
  flightProviderApiKey: process.env.FLIGHT_PROVIDER_API_KEY || '',
  flightProviderIataCode: process.env.FLIGHT_PROVIDER_IATA_CODE || 'RRG',
  flightProviderAirlineFilter: process.env.FLIGHT_PROVIDER_AIRLINE_FILTER || '',
  weatherProviderEndpoint: resolvedWeatherProviderEndpoint,
  weatherProviderApiKey: process.env.WEATHER_PROVIDER_API_KEY || '',
  // Plaine Corail Airport ARP coordinates from Mauritius AIP AD 2 FIMR.
  weatherProviderLatitude: readNumber(process.env.WEATHER_PROVIDER_LATITUDE, -19.757778),
  weatherProviderLongitude: readNumber(process.env.WEATHER_PROVIDER_LONGITUDE, 63.361389),
  weatherProviderTimezone: process.env.WEATHER_PROVIDER_TIMEZONE || 'Indian/Mauritius',

  // Revalidation
  revalidateSecret: process.env.REVALIDATE_SECRET || '',
} as const
