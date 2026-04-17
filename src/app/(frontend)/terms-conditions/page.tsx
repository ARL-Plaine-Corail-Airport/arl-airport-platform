import { PageHero } from '@/components/ui/page-hero'
import { RichText } from '@/components/ui/rich-text'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { formatDateTime } from '@/lib/date'
import { getLegalPages } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)
    return buildFrontendMetadata({
      locale,
      title: `${dict.pages.terms_title} - ${dict.common.airport_location}`,
      description: dict.pages.terms_summary,
      path: '/terms-conditions',
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

export default async function TermsConditionsPage() {
  const locale = await getLocale()
  const [dict, legal] = await Promise.all([getDictionary(locale), getLegalPages(locale)])
  const page = legal.termsOfUse

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_legal}
        title={page.title ?? dict.pages.terms_title}
        summary={dict.pages.terms_summary}
      />
      <section className="page-section">
        <div className="container">
          <article className="card stack-sm">
            {(page.lastUpdated || page.effectiveDate) && (
              <p className="meta">
                {page.lastUpdated ? `${dict.labels.updated}: ${formatDateTime(page.lastUpdated, locale)}` : ''}
                {page.lastUpdated && page.effectiveDate ? ' \u00B7 ' : ''}
                {page.effectiveDate ? `${dict.labels.effective}: ${formatDateTime(page.effectiveDate, locale)}` : ''}
              </p>
            )}
            <RichText data={page.content} />
          </article>
        </div>
      </section>
    </main>
  )
}
