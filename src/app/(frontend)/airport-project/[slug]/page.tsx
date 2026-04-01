import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { MediaFigure } from '@/components/ui/media-figure'
import { PageHero } from '@/components/ui/page-hero'
import { RichText } from '@/components/ui/rich-text'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import {
  getAirportProjectBySlug,
  getAirportProjectItems,
} from '@/lib/content'
import { formatDateTime } from '@/lib/date'
import { env } from '@/lib/env'
import { buildFrontendMetadata } from '@/lib/metadata'
import {
  buildBreadcrumbSchema,
  buildNewsArticleSchema,
  JsonLd,
} from '@/lib/structured-data'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const items = await getAirportProjectItems(100)
  return items.map((item: any) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const [dict, item] = await Promise.all([
    getDictionary(locale),
    getAirportProjectBySlug(slug, locale),
  ])

  if (!item) {
    return buildFrontendMetadata({
      locale,
      title: dict.pages.airport_project_not_found,
      description: dict.pages.airport_project_not_found_desc,
      path: `/airport-project/${slug}`,
    })
  }

  const media = typeof item.featuredImage === 'object' ? item.featuredImage : null
  const image = media?.url
    ? {
        url: media.url,
        alt: media.alt ?? undefined,
        width: media.width ?? undefined,
        height: media.height ?? undefined,
      }
    : undefined

  return buildFrontendMetadata({
    locale,
    title: item.seo?.metaTitle || `${item.title} - ${dict.pages.airport_project_title}`,
    description: item.seo?.metaDescription || item.summary,
    path: `/airport-project/${slug}`,
    image,
    type: 'article',
    publishedTime: item.publishedAt ?? undefined,
    modifiedTime: item.updatedAt ?? undefined,
  })
}

export default async function AirportProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const [dict, item] = await Promise.all([
    getDictionary(locale),
    getAirportProjectBySlug(slug, locale),
  ])

  if (!item) notFound()

  const homeUrl = new URL(localePath('/', locale), env.siteURL).toString()
  const listingUrl = new URL(
    localePath('/airport-project', locale),
    env.siteURL,
  ).toString()
  const itemUrl = new URL(
    localePath(`/airport-project/${slug}`, locale),
    env.siteURL,
  ).toString()
  const featuredMedia = typeof item.featuredImage === 'object' ? item.featuredImage : null

  const articleSchema = buildNewsArticleSchema({
    title: item.title,
    description: item.summary,
    url: itemUrl,
    publishedAt: item.publishedAt ?? undefined,
    updatedAt: item.updatedAt ?? undefined,
    imageUrl: featuredMedia?.url ?? undefined,
    publisherName: 'Airport of Rodrigues Ltd',
    publisherUrl: homeUrl,
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: homeUrl },
    { name: dict.pages.airport_project_title, url: listingUrl },
    { name: item.title, url: itemUrl },
  ])

  return (
    <main>
      <JsonLd data={articleSchema} nonce={nonce} />
      <JsonLd data={breadcrumbSchema} nonce={nonce} />
      <PageHero
        eyebrow={dict.pages.airport_project_title}
        title={item.title}
        summary={item.summary}
      />
      <section className="page-section">
        <div className="container">
          <article className="card stack-sm">
            <MediaFigure
              media={item.featuredImage}
              altFallback={item.title}
              priority
              showCaption
            />
            <p className="meta">
              {dict.labels.published}: {formatDateTime(item.publishedAt, locale)} &middot;{' '}
              {dict.labels.updated}: {formatDateTime(item.updatedAt, locale)}
            </p>
            {item.body && <RichText data={item.body} />}

            {Array.isArray(item.attachments) && item.attachments.length > 0 && (
              <div className="news-detail__attachments">
                <h3>{dict.labels?.attachments ?? 'Attachments'}</h3>
                <ul className="news-detail__file-list">
                  {item.attachments.map((att: any, i: number) => {
                    const fileUrl = typeof att.file === 'object' ? att.file?.url : null
                    if (!fileUrl) return null
                    return (
                      <li key={i}>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-item__download"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          {att.label}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  )
}
