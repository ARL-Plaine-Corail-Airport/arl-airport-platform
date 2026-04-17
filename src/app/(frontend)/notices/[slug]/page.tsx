import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/ui/page-hero'
import { RichText } from '@/components/ui/rich-text'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { getNoticeBySlug } from '@/lib/content'
import { formatDateTime } from '@/lib/date'
import { env } from '@/lib/env'
import { buildFrontendMetadata } from '@/lib/metadata'
import {
  buildBreadcrumbSchema,
  buildNewsArticleSchema,
  JsonLd,
} from '@/lib/structured-data'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const [dict, notice] = await Promise.all([
    getDictionary(locale),
    getNoticeBySlug(slug, locale),
  ])

  if (!notice) {
    return buildFrontendMetadata({
      locale,
      title: dict.pages.notice_not_found,
      description: dict.pages.notice_not_found_desc,
      path: `/notices/${slug}`,
    })
  }

  return buildFrontendMetadata({
    locale,
    title: notice.seo?.metaTitle || `${notice.title} - Notice`,
    description: notice.seo?.metaDescription || notice.summary,
    path: `/notices/${slug}`,
    type: 'article',
    publishedTime: notice.publishedAt ?? undefined,
    modifiedTime: notice.updatedAt ?? undefined,
  })
}

export default async function NoticeDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const [dict, notice] = await Promise.all([
    getDictionary(locale),
    getNoticeBySlug(slug, locale),
  ])

  if (!notice) notFound()

  const homeUrl = new URL(localePath('/', locale), env.siteURL).toString()
  const listingUrl = new URL(localePath('/notices', locale), env.siteURL).toString()
  const noticeUrl = new URL(
    localePath(`/notices/${slug}`, locale),
    env.siteURL,
  ).toString()

  const articleSchema = buildNewsArticleSchema({
    title: notice.title,
    description: notice.summary,
    url: noticeUrl,
    publishedAt: notice.publishedAt ?? undefined,
    updatedAt: notice.updatedAt ?? undefined,
    publisherName: 'Airport of Rodrigues Ltd',
    publisherUrl: homeUrl,
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: homeUrl },
    { name: dict.pages.notices_title, url: listingUrl },
    { name: notice.title, url: noticeUrl },
  ])

  return (
    <main>
      <JsonLd data={articleSchema} nonce={nonce} />
      <JsonLd data={breadcrumbSchema} nonce={nonce} />
      <PageHero
        eyebrow={dict.pages.eyebrow_official_notice}
        title={notice.title}
        summary={notice.summary}
      />
      <section className="page-section">
        <div className="container">
          <article className="card stack-sm">
            <p className="meta">
              {dict.labels.published}: {formatDateTime(notice.publishedAt, locale)} &middot;{' '}
              {dict.labels.updated}: {formatDateTime(notice.updatedAt, locale)}
            </p>
            <RichText data={notice.body} />
            {notice.attachments?.length ? (
              <div className="stack-sm">
                <h2>{dict.labels.attachments}</h2>
                <ul className="content-list">
                  {notice.attachments.map((attachment: any, index: number) => (
                    <li key={attachment?.id ?? `att-${index}`}>
                      {attachment?.filename ||
                        attachment?.alt ||
                        dict.labels.attached_document}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  )
}
