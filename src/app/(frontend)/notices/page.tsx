import { Suspense } from 'react'

import { FilterChips } from '@/components/ui/filter-chips'
import { NoticeCard } from '@/components/ui/notice-card'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { getLatestNotices } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 60

function FilterChipsSkeleton() {
  return <div className="filter-chips-skeleton" aria-hidden />
}

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.notices_title} - ${dict.common.airport_location}`,
    description: dict.pages.notices_summary,
    path: '/notices',
  })
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const locale = await getLocale()
  const params = await searchParams
  const [dict, allNotices] = await Promise.all([
    getDictionary(locale),
    getLatestNotices(30, locale),
  ])
  const localizedBasePath = localePath('/notices', locale)

  const noticeCategories = dict.notice_categories

  // Extract unique categories from notices
  const categories = Array.from(
    new Set(allNotices.map((n: any) => n.category).filter(Boolean)),
  ) as string[]

  const categoryOptions = categories.map((cat) => ({
    value: cat,
    label: noticeCategories[cat as keyof typeof noticeCategories] ?? cat,
  }))

  // Filter if category param is set
  const activeCategory = params.category ?? ''
  const notices = activeCategory
    ? allNotices.filter((n: any) => n.category === activeCategory)
    : allNotices

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_official_info}
        title={dict.pages.notices_title}
        summary={dict.pages.notices_summary}
      />
      <section className="page-section">
        <div className="container">
          {categoryOptions.length > 1 && (
            <Suspense fallback={<FilterChipsSkeleton />}>
              <FilterChips
                paramName="category"
                basePath={localizedBasePath}
                options={categoryOptions}
              />
            </Suspense>
          )}
          <div className="notice-list">
            {notices.length ? (
              notices.map((notice: any) => <NoticeCard key={notice.id} notice={notice} />)
            ) : (
              <article className="card">
                <p>{dict.pages.no_notices}</p>
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
