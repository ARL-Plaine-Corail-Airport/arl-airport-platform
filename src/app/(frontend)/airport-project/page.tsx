import { Suspense } from 'react'
import Link from 'next/link'

import { FilterChips } from '@/components/ui/filter-chips'
import { MediaFigure } from '@/components/ui/media-figure'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { getAirportProjectItems } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 60

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)
    return buildFrontendMetadata({
      locale,
      title: `${dict.pages.airport_project_title} - ${dict.common.airport_location}`,
      description: dict.pages.airport_project_summary,
      path: '/airport-project',
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

function FilterChipsSkeleton() {
  return <div className="filter-chips-skeleton" aria-hidden />
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

function getCategoryClass(category: string) {
  const classes: Record<string, string> = {
    notice_to_bidders: 'pill--primary',
    press_release: 'pill--primary',
    site_visit: 'pill--event',
    environmental: 'pill--warning',
    general: '',
  }
  return classes[category] ?? ''
}

export default async function AirportProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const locale = await getLocale()
  const [dict, items, params] = await Promise.all([
    getDictionary(locale),
    getAirportProjectItems(24, locale),
    searchParams,
  ])
  const lp = (path: string) => localePath(path, locale)
  const localizedBasePath = localePath('/airport-project', locale)
  const projectCategories = dict.project_categories

  const activeCat = params.category ?? ''
  const uniqueCats = Array.from(new Set(items.map((i: any) => i.category).filter(Boolean))) as string[]
  const catOptions = uniqueCats.map((c) => ({ value: c, label: projectCategories[c as keyof typeof projectCategories] ?? c }))
  const filtered = activeCat ? items.filter((i: any) => i.category === activeCat) : items

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_updates}
        title={dict.pages.airport_project_title}
        summary={dict.pages.airport_project_summary}
      />
      <section className="page-section">
        <div className="container">
          {catOptions.length > 1 && (
            <Suspense fallback={<FilterChipsSkeleton />}>
              <FilterChips paramName="category" basePath={localizedBasePath} options={catOptions} />
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
                      <span className={`pill ${getCategoryClass(item.category)}`}>
                        {projectCategories[item.category as keyof typeof projectCategories] ?? item.category}
                      </span>
                      {item.isPinned && (
                        <span className="pill pill--danger">{dict.labels.featured}</span>
                      )}
                    </div>

                    <Link href={lp(`/airport-project/${item.slug}`)} className="news-item__title-link">
                      <h2 className="news-item__title">{item.title}</h2>
                    </Link>

                    {item.summary && <p className="news-item__summary">{item.summary}</p>}

                    {/* Attachment links */}
                    {item.attachments?.length > 0 && (
                      <div className="news-item__links">
                        {item.attachments.map((att: any, i: number) => {
                          const fileUrl = typeof att.file === 'object' ? att.file?.url : null
                          if (!fileUrl) return null
                          const attachmentKey =
                            att.id ??
                            (typeof att.file === 'object' ? att.file?.id : undefined) ??
                            `att-${att.label ?? 'attachment'}-${i}`
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
                    <Link href={lp(`/airport-project/${item.slug}`)} className="news-item__read-more">
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
              <p className="meta">{dict.pages.no_airport_project}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
