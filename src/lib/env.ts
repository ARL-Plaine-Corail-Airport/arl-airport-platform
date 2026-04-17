// =============================================================================
// Typed environment variable access
//
// RULE: NEXT_PUBLIC_ vars are safe for the browser.
//       This module must only export browser-safe values.
// =============================================================================

// Public (browser-safe)
export const env = {
  // Application
  siteURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Supabase (browser-safe: used to construct public media URLs)
  supabaseURL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // Integration adapters
  weatherProviderMode: 'open-meteo' as const,
  weatherProviderLabel: 'Open-Meteo Forecast API',
} as const
