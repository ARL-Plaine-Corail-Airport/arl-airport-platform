import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { MediaFigure } from '@/components/ui/media-figure'
import { PageHero } from '@/components/ui/page-hero'
import { RichText } from '@/components/ui/rich-text'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { shouldSkipDbDuringBuild } from '@/lib/build-db'
import {
  getNewsEventBySlugWithSignedAttachments,
  getNewsEvents,
} from '@/lib/content'
import { formatDateTime } from '@/lib/date'
import { env } from '@/lib/env'
import { buildFrontendMetadata } from '@/lib/metadata'
import {
  buildBreadcrumbSchema,
  buildEventSchema,
  buildNewsArticleSchema,
  JsonLd,
} from '@/lib/structured-data'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  if (shouldSkipDbDuringBuild()) {
    return []
  }

  const items = await getNewsEvents(100)
  return items.map((item: any) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const [dict, item] = await Promise.all([
    getDictionary(locale),
    getNewsEventBySlugWithSignedAttachments(slug, locale),
  ])

  if (!item) {
    return buildFrontendMetadata({
      locale,
      title: dict.pages.news_not_found,
      description: dict.pages.news_not_found_desc,
      path: `/news-events/${slug}`,
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
    title: item.seo?.metaTitle || `${item.title} - ${dict.pages.news_title}`,
    description: item.seo?.metaDescription || item.summary,
    path: `/news-events/${slug}`,
    image,
    type: 'article',
    publishedTime: item.publishedAt ?? undefined,
    modifiedTime: item.updatedAt ?? undefined,
  })
}

export default async function NewsEventDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const [dict, item] = await Promise.all([
    getDictionary(locale),
    getNewsEventBySlugWithSignedAttachments(slug, locale),
  ])

  if (!item) notFound()

  const homeUrl = new URL(localePath('/', locale), env.siteURL).toString()
  const listingUrl = new URL(localePath('/news-events', locale), env.siteURL).toString()
  const itemUrl = new URL(
    localePath(`/news-events/${slug}`, locale),
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
    { name: dict.pages.news_title, url: listingUrl },
    { name: item.title, url: itemUrl },
  ])

  const eventSchema =
    item.type === 'event'
      ? buildEventSchema({
          name: item.title,
          description: item.summary,
          url: itemUrl,
          startDate: item.eventDetails?.startDate ?? undefined,
          endDate: item.eventDetails?.endDate ?? undefined,
          location: item.eventDetails?.location ?? undefined,
          imageUrl: featuredMedia?.url ?? undefined,
          organizerName: 'Airport of Rodrigues Ltd',
          organizerUrl: homeUrl,
        })
      : null

  return (
    <main>
      <JsonLd data={articleSchema} nonce={nonce} />
      <JsonLd data={breadcrumbSchema} nonce={nonce} />
      {eventSchema && <JsonLd data={eventSchema} nonce={nonce} />}
      <PageHero
        eyebrow={dict.pages.eyebrow_news}
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
            <RichText data={item.body} />

            {Array.isArray(item.attachments) && item.attachments.length > 0 && (
              <div className="news-detail__attachments">
                <h3>{dict.labels?.attachments ?? 'Attachments'}</h3>
                <ul className="news-detail__file-list">
                  {item.attachments.map((att: any) => {
                    const fileUrl = typeof att.file === 'object' ? att.file?.url : null
                    if (!fileUrl) return null
                    const attachmentKey = `${item.id ?? slug}-${att.label ?? 'attachment'}-${fileUrl}`
                    return (
                      <li key={attachmentKey}>
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
