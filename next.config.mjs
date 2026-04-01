import path from 'node:path'
import { withPayload } from '@payloadcms/next/withPayload'

const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev and production artifacts separate. Payload admin emits a large
  // vendor chunk graph, and sharing one dist dir between `next dev` and
  // `next build` can leave stale chunk references behind on Windows.
  distDir: isDev ? '.next-dev' : '.next',

  // Required for Docker: produces a self-contained server.js with all dependencies.
  // The Dockerfile copies .next/standalone as the runtime artefact.
  output: process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : undefined,

  images: {
    remotePatterns: [
      // Supabase Storage public bucket — images served directly from CDN edge
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase Storage signed URLs (protected documents served server-side)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
      // Local Payload media in development
      ...(isDev
        ? [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: 'localhost' },
          ]
        : []),
    ],
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@payload-config': path.resolve(process.cwd(), 'payload.config.ts'),
    }
    return config
  },

  async headers() {
    // Security headers — CSP is now handled per-request in middleware.ts
    // with nonce-based script-src instead of 'unsafe-inline'.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options',  value: 'nosniff'                         },
          ...(!isDev ? [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] : []),
          {
            key:   'Permissions-Policy',
            value: 'camera=(), geolocation=(self), microphone=()',
          },
          // HSTS — enforces HTTPS for all future visits (2 years)
          ...(!isDev ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
        ],
      },
      // Service worker must be served without cache for update detection
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
