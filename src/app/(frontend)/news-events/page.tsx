import { Suspense } from 'react'
import Link from 'next/link'

import { FilterChips } from '@/components/ui/filter-chips'
import { MediaFigure } from '@/components/ui/media-figure'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { getNewsEventsWithSignedAttachments } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 60

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.news_title} - ${dict.common.airport_location}`,
    description: dict.pages.news_summary,
    path: '/news-events',
  })
}

function formatDay(dateStr: string) {
  return new Date(dateStr).getDate()
}

function formatMonthYear(dateStr: string, locale: string) {
  const d = new Date(dateStr)
  const intlLocale = locale === 'mfe' ? 'fr' : locale
  const month = d.toLocaleString(intlLocale, { month: 'short' })
  return `${month}\n${d.getFullYear()}`
}

function getTypeClass(type: string) {
  const classes: Record<string, string> = {
    news: 'pill--primary',
    press: 'pill--primary',
    event: 'pill--event',
    announcement: 'pill--warning',
  }
  return classes[type] ?? ''
}

function FilterChipsSkeleton() {
  return <div className="filter-chips-skeleton" aria-hidden />
}

export default async function NewsEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const locale = await getLocale()
  const [dict, items, params] = await Promise.all([
    getDictionary(locale),
    getNewsEventsWithSignedAttachments(24, locale),
    searchParams,
  ])
  const lp = (path: string) => localePath(path, locale)
  const localizedBasePath = localePath('/news-events', locale)
  const newsTypes = dict.news_types

  const activeType = params.type ?? ''
  const uniqueTypes = Array.from(new Set(items.map((i: any) => i.type).filter(Boolean))) as string[]
  const typeOptions = uniqueTypes.map((t) => ({ value: t, label: newsTypes[t as keyof typeof newsTypes] ?? t }))
  const filtered = activeType ? items.filter((i: any) => i.type === activeType) : items

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_updates}
        title={dict.pages.news_title}
        summary={dict.pages.news_summary}
      />
      <section className="page-section">
        <div className="container">
          {typeOptions.length > 1 && (
            <Suspense fallback={<FilterChipsSkeleton />}>
              <FilterChips paramName="type" basePath={localizedBasePath} options={typeOptions} />
            </Suspense>
          )}
          {filtered.length ? (
            <div className="news-feed">
              {filtered.map((item: any) => (
                <article key={item.id} className="news-item">
                  {/* Date block */}
                  {item.publishedAt && (
                    <div className="news-item__date">
                      <span className="news-item__day">{formatDay(item.publishedAt)}</span>
                      <span className="news-item__month">{formatMonthYear(item.publishedAt, locale)}</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="news-item__body">
                    <div className="news-item__meta">
                      <span className={`pill ${getTypeClass(item.type)}`}>
                        {newsTypes[item.type as keyof typeof newsTypes] ?? item.type}
                      </span>
                      {item.isPinned && (
                        <span className="pill pill--danger">{dict.labels.featured}</span>
                      )}
                    </div>

                    <Link href={lp(`/news-events/${item.slug}`)} className="news-item__title-link">
                      <h2 className="news-item__title">{item.title}</h2>
                    </Link>

                    {item.summary && <p className="news-item__summary">{item.summary}</p>}

                    {/* Attachment links */}
                    {item.attachments?.length > 0 && (
                      <div className="news-item__links">
                        {item.attachments.map((att: any) => {
                          const fileUrl = typeof att.file === 'object' ? att.file?.url : null
                          if (!fileUrl) return null
                          const attachmentKey = `${item.id ?? item.slug}-${att.label ?? 'attachment'}-${fileUrl}`
                          return (
                            <a
                              key={attachmentKey}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="news-item__download"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              {att.label}
                            </a>
                          )
                        })}
                      </div>
                    )}

                    {/* Read more */}
                    <Link href={lp(`/news-events/${item.slug}`)} className="news-item__read-more">
                      {dict.labels.read_more}
                    </Link>
                  </div>

                  {/* Thumbnail */}
                  {item.featuredImage && (
                    <div className="news-item__thumb">
                      <MediaFigure
                        media={item.featuredImage}
                        altFallback={item.title}
                        size="thumbnail"
                        variant="card"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <article className="card">
              <p className="meta">{dict.pages.no_news}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
