import type { MetadataRoute } from 'next'

import { defaultLocale } from '@/i18n/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rodrigues Airport Passenger Information Platform',
    short_name: 'Rodrigues Airport',
    description:
      'Official passenger platform for notices, arrivals, departures, passenger guidance, accessibility, and transport information.',
    start_url: `/${defaultLocale}`,
    display: 'standalone',
    background_color: '#114c7a',
    theme_color: '#114c7a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    id: '/',
  }
}
