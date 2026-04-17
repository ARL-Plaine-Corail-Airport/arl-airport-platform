import { describe, expect, it, vi } from 'vitest'

const { getSiteSettings } = vi.hoisted(() => ({
  getSiteSettings: vi.fn(),
}))

vi.mock('@/lib/content', () => ({
  getSiteSettings,
}))

import { buildFrontendMetadata } from '@/lib/metadata'

describe('buildFrontendMetadata', () => {
  it('builds metadata with locale alternates and fallback OG media', async () => {
    getSiteSettings.mockResolvedValue({
      siteName: 'Airport of Rodrigues Ltd',
      defaultOgImage: {
        url: '/images/default-og.jpg',
        alt: 'Airport terminal',
        width: 1200,
        height: 630,
      },
    })

    const metadata = await buildFrontendMetadata({
      locale: 'fr',
      title: 'Contact',
      description: 'Airport contact details',
      path: '/contact',
      type: 'article',
      publishedTime: '2026-04-07T10:00:00.000Z',
      modifiedTime: '2026-04-07T12:00:00.000Z',
      robots: {
        index: true,
        follow: false,
      },
    })

    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/fr/contact')
    expect(metadata.alternates?.languages).toMatchObject({
      en: 'http://localhost:3000/en/contact',
      fr: 'http://localhost:3000/fr/contact',
      mfe: 'http://localhost:3000/mfe/contact',
      'x-default': 'http://localhost:3000/en/contact',
    })
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-04-07T10:00:00.000Z',
      modifiedTime: '2026-04-07T12:00:00.000Z',
      images: [
        {
          url: 'http://localhost:3000/images/default-og.jpg',
          alt: 'Airport terminal',
          width: 1200,
          height: 630,
        },
      ],
    })
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['http://localhost:3000/images/default-og.jpg'],
    })
    expect(metadata.robots).toEqual({
      index: true,
      follow: false,
    })
  })

  it('prefers an explicit image when one is provided', async () => {
    getSiteSettings.mockResolvedValue({
      siteName: 'Airport of Rodrigues Ltd',
      defaultOgImage: null,
    })

    const metadata = await buildFrontendMetadata({
      locale: 'en',
      title: 'Flights',
      description: 'Live flight board',
      path: '/flight-status',
      image: {
        url: '/images/flights.jpg',
      },
    })

    expect(metadata.openGraph).toMatchObject({
      images: [{ url: 'http://localhost:3000/images/flights.jpg' }],
    })
    expect(metadata.twitter).toMatchObject({
      images: ['http://localhost:3000/images/flights.jpg'],
    })
  })
})
