import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  JsonLd,
  buildBreadcrumbSchema,
  buildEventSchema,
  buildFAQPageSchema,
  buildNewsArticleSchema,
  buildOrganizationSchema,
} from '@/lib/structured-data'

describe('structured data helpers', () => {
  it('builds organization schemas with optional contact and social fields', () => {
    expect(
      buildOrganizationSchema({
        siteName: 'Airport of Rodrigues Ltd',
        airportName: 'Plaine Corail Airport',
        url: 'https://airport.example.com',
        phone: '+2301234567',
        email: 'info@example.com',
        address: 'Plaine Corail Airport, Rodrigues',
        socialLinks: [{ url: 'https://facebook.com/airport' }],
      }),
    ).toEqual([
      expect.objectContaining({
        '@type': 'Organization',
        telephone: '+2301234567',
        email: 'info@example.com',
        sameAs: ['https://facebook.com/airport'],
      }),
      expect.objectContaining({
        '@type': 'WebSite',
        url: 'https://airport.example.com',
      }),
    ])
  })

  it('builds article, breadcrumb, faq, and event schemas', () => {
    expect(
      buildNewsArticleSchema({
        title: 'Runway update',
        description: 'Progress on airport works',
        url: 'https://airport.example.com/news/runway',
        publishedAt: '2026-04-07T10:00:00.000Z',
        updatedAt: '2026-04-07T12:00:00.000Z',
        imageUrl: 'https://airport.example.com/og.jpg',
        publisherName: 'Airport of Rodrigues Ltd',
        publisherUrl: 'https://airport.example.com',
      }),
    ).toMatchObject({
      '@type': 'NewsArticle',
      datePublished: '2026-04-07T10:00:00.000Z',
      dateModified: '2026-04-07T12:00:00.000Z',
      image: 'https://airport.example.com/og.jpg',
    })

    expect(
      buildBreadcrumbSchema([
        { name: 'Home', url: 'https://airport.example.com/en' },
        { name: 'News', url: 'https://airport.example.com/en/news' },
      ]),
    ).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        expect.objectContaining({ position: 1, name: 'Home' }),
        expect.objectContaining({ position: 2, name: 'News' }),
      ],
    })

    expect(
      buildFAQPageSchema([{ question: 'When do I check in?', answer: 'Two hours before departure.' }]),
    ).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [
        expect.objectContaining({
          name: 'When do I check in?',
          acceptedAnswer: expect.objectContaining({
            text: 'Two hours before departure.',
          }),
        }),
      ],
    })

    expect(
      buildEventSchema({
        name: 'Airport Open Day',
        description: 'Community airport event',
        url: 'https://airport.example.com/events/open-day',
        startDate: '2026-05-01T09:00:00.000Z',
        endDate: '2026-05-01T15:00:00.000Z',
        location: 'Plaine Corail Airport',
        imageUrl: 'https://airport.example.com/events/open-day.jpg',
        organizerName: 'Airport of Rodrigues Ltd',
        organizerUrl: 'https://airport.example.com',
      }),
    ).toMatchObject({
      '@type': 'Event',
      startDate: '2026-05-01T09:00:00.000Z',
      endDate: '2026-05-01T15:00:00.000Z',
      image: 'https://airport.example.com/events/open-day.jpg',
      location: expect.objectContaining({
        name: 'Plaine Corail Airport',
      }),
    })
  })

  it('renders JSON-LD with a nonce', () => {
    const { container } = render(
      <JsonLd data={{ '@context': 'https://schema.org' }} nonce="nonce-123" />,
    )
    const script = container.querySelector('script')

    expect(script).not.toBeNull()
    expect(script).toHaveAttribute('nonce', 'nonce-123')
    expect(script).toHaveAttribute('type', 'application/ld+json')
    expect(script?.innerHTML).toBe('{"@context":"https://schema.org"}')
  })
})
