// =============================================================================
// Payload CMS Configuration — ARL Airport Platform
//
// DATABASE:  Supabase Postgres (via @payloadcms/db-postgres + Drizzle)
//            DATABASE_URL        → pooled connection (PgBouncer, runtime)
//            DATABASE_DIRECT_URL → direct connection (migrations only)
//
// STORAGE:   Supabase Storage (S3-compatible via @payloadcms/storage-s3)
//            arl-public-media    → images (public, CDN)
//            arl-protected-docs  → PDFs (private, signed URLs)
//
// COLLECTIONS: Users, Media, Documents, Flights, Notices, Pages, FAQs, Airlines, NewsEvents
// GLOBALS:     SiteSettings, HomePage, PassengerGuide, TransportParking,
//              AccessibilityInfo, AirportMap, ContactInfo,
//              Regulations, UsageFees, VIPLounge, EmergencyServices,
//              ManagementStaff, WorkingHoursDirections, UsefulLinks, LegalPages
// =============================================================================

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter }  from '@payloadcms/db-postgres'
import { lexicalEditor }    from '@payloadcms/richtext-lexical'
import { s3Storage }        from '@payloadcms/storage-s3'
import { buildConfig }      from 'payload'
import sharp                from 'sharp'

// Collections
import { Airlines }        from './src/collections/Airlines'
import { AirportProject }  from './src/collections/AirportProject'
import { Documents }  from './src/collections/Documents'
import { Flights }    from './src/collections/Flights'
import { FAQs }       from './src/collections/FAQs'
import { Media }      from './src/collections/Media'
import { NewsEvents } from './src/collections/NewsEvents'
import { Notices }    from './src/collections/Notices'
import { Pages }      from './src/collections/Pages'
import { PageViews }  from './src/collections/PageViews'
import { Users }      from './src/collections/Users'

// Globals — existing
import { AccessibilityInfo } from './src/globals/AccessibilityInfo'
import { AirportMap }        from './src/globals/AirportMap'
import { ContactInfo }       from './src/globals/ContactInfo'
import { HomePage }          from './src/globals/HomePage'
import { PassengerGuide }    from './src/globals/PassengerGuide'
import { SiteSettings }      from './src/globals/SiteSettings'
import { TransportParking }  from './src/globals/TransportParking'

// Globals — new
import { EmergencyServices }      from './src/globals/EmergencyServices'
import { LegalPages }             from './src/globals/LegalPages'
import { ManagementStaff }        from './src/globals/ManagementStaff'
import { Regulations }            from './src/globals/Regulations'
import { UsageFees }              from './src/globals/UsageFees'
import { UsefulLinks }            from './src/globals/UsefulLinks'
import { VIPLounge }              from './src/globals/VIPLounge'
import { WorkingHoursDirections } from './src/globals/WorkingHoursDirections'

const filename = fileURLToPath(import.meta.url)
const dirname  = path.dirname(filename)

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val && process.env.NODE_ENV === 'production') {
    throw new Error(`[payload.config] Required env var "${name}" is not set.`)
  }
  return val ?? ''
}

const s3Config = {
  credentials: {
    accessKeyId:     requireEnv('SUPABASE_S3_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('SUPABASE_S3_SECRET_ACCESS_KEY'),
  },
  endpoint:       requireEnv('SUPABASE_S3_ENDPOINT'),
  region:         process.env.SUPABASE_S3_REGION ?? 'eu-west-1',
  forcePathStyle: true,
}

const mediaBucket     = process.env.SUPABASE_STORAGE_BUCKET_MEDIA     ?? 'arl-public-media'
const documentsBucket = process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS ?? 'arl-protected-docs'

// ── Pool config builder ───────────────────────────────────────────────────────
// Problem: pg-connection-string v2.7+ treats ?sslmode=require as verify-full,
// which fails on Supabase's self-signed CA chain.
// Without sslmode in the URL, pg skips SSL entirely → Supabase can't route
// the connection via SNI → "Tenant or user not found".
//
// Solution: parse the URL manually using Node's built-in URL class (no
// pg-connection-string involved), then inject ssl: { rejectUnauthorized: false }
// as a first-class pool option. This gives us encrypted SSL with SNI (so
// Supabase can route correctly) without CA chain verification.
function buildPoolConfig(connectionString: string) {
  try {
    // Strip query params before parsing (pgbouncer=true, sslmode=require, etc.)
    const clean  = connectionString.split('?')[0]
    const url    = new URL(clean)
    return {
      host:     url.hostname,
      port:     parseInt(url.port, 10) || 5432,
      database: url.pathname.slice(1),
      user:     decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl:      { rejectUnauthorized: false, servername: url.hostname },
      max:      5,
    }
  } catch {
    // Fallback if URL parsing fails (e.g. local postgres without protocol)
    return {
      connectionString,
      ssl:  true,
      max:  5,
    }
  }
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  secret:    requireEnv('PAYLOAD_SECRET'),
  sharp,
  editor: lexicalEditor({}),

  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, 'src'),
    },
    meta: {
      titleSuffix: '- ARL Content Platform',
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo',
        Icon: '@/components/admin/Icon',
      },
      beforeDashboard: ['@/components/admin/BeforeDashboard'],
      afterNavLinks:   ['@/components/admin/NavToggle'],
    },
  },

  localization: {
    locales: [
      { label: 'English',         code: 'en'  },
      { label: 'Français',        code: 'fr'  },
      { label: 'Kreol Morisien',  code: 'mfe' },
    ],
    defaultLocale: 'en',
    fallback:      true,
  },

  // ── Database — Supabase Postgres ──────────────────────────────────────────
  db: postgresAdapter({
    pool: buildPoolConfig(process.env.DATABASE_URL ?? ''),
    push: false,
  }),

  // ── Storage — Supabase Storage (S3-compatible) ────────────────────────────
  plugins: [
    // Public images → arl-public-media bucket
    s3Storage({
      collections: {
        media: { prefix: 'uploads' },
      },
      bucket: mediaBucket,
      config: s3Config,
    }),

    // Protected PDFs → arl-protected-docs bucket
    // Access via server-generated signed URLs only (getSignedURL in supabase-client.ts)
    s3Storage({
      collections: {
        documents: { prefix: 'uploads' },
      },
      bucket: documentsBucket,
      config: s3Config,
    }),
  ],

  collections: [
    Users,
    Media,
    Documents,
    Flights,
    Notices,
    Pages,
    FAQs,
    Airlines,
    NewsEvents,
    AirportProject,
    PageViews,
  ],

  globals: [
    SiteSettings,
    HomePage,
    PassengerGuide,
    TransportParking,
    AccessibilityInfo,
    AirportMap,
    ContactInfo,
    Regulations,
    UsageFees,
    VIPLounge,
    EmergencyServices,
    WorkingHoursDirections,
    UsefulLinks,
    ManagementStaff,
    LegalPages,
  ],

  hooks: {},

  cors: [requireEnv('NEXT_PUBLIC_SITE_URL')],
  csrf: [requireEnv('NEXT_PUBLIC_SITE_URL')],

  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
})
