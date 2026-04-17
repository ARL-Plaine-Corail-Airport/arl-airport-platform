import { env } from '@/lib/env'

// ---------------------------------------------------------------------------
// JSON-LD structured data helpers for schema.org
// ---------------------------------------------------------------------------

export function buildOrganizationSchema(site: {
  siteName: string
  airportName: string
  url: string
  phone?: string
  email?: string
  address?: string
  socialLinks?: Array<{ url: string }>
}) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.siteName,
      alternateName: site.airportName,
      url: site.url,
      ...(site.phone && { telephone: site.phone }),
      ...(site.email && { email: site.email }),
      ...(site.address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.address,
        },
      }),
      ...(site.socialLinks?.length && {
        sameAs: site.socialLinks.map((l) => l.url),
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.siteName,
      url: site.url,
    },
  ]
}

export function buildNewsArticleSchema(article: {
  title: string
  description: string
  url: string
  publishedAt?: string
  updatedAt?: string
  imageUrl?: string
  publisherName: string
  publisherUrl: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    url: article.url,
    ...(article.publishedAt && { datePublished: article.publishedAt }),
    ...(article.updatedAt && { dateModified: article.updatedAt }),
    ...(article.imageUrl && { image: article.imageUrl }),
    publisher: {
      '@type': 'Organization',
      name: article.publisherName,
      url: article.publisherUrl,
    },
  }
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildFAQPageSchema(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function buildEventSchema(event: {
  name: string
  description: string
  url: string
  startDate?: string
  endDate?: string
  location?: string
  imageUrl?: string
  organizerName: string
  organizerUrl: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    url: event.url,
    ...(event.startDate && { startDate: event.startDate }),
    ...(event.endDate && { endDate: event.endDate }),
    ...(event.location && {
      location: {
        '@type': 'Place',
        name: event.location,
      },
    }),
    ...(event.imageUrl && { image: event.imageUrl }),
    organizer: {
      '@type': 'Organization',
      name: event.organizerName,
      url: event.organizerUrl,
    },
  }
}

/** Renders a JSON-LD `<script>` tag for structured data. */
export function JsonLd({ data, nonce }: { data: unknown; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
