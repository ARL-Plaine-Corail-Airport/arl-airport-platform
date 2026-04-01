import { PageHero } from '@/components/ui/page-hero'
import { RichText } from '@/components/ui/rich-text'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { formatDateTime } from '@/lib/date'
import { getLegalPages } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.disclaimer_title} - ${dict.common.airport_location}`,
    description: dict.pages.disclaimer_summary,
    path: '/disclaimer',
  })
}

export default async function DisclaimerPage() {
  const locale = await getLocale()
  const [dict, legal] = await Promise.all([getDictionary(locale), getLegalPages(locale)])
  const page = legal.disclaimer

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_legal}
        title={page.title ?? dict.pages.disclaimer_title}
        summary={dict.pages.disclaimer_summary}
      />
      <section className="page-section">
        <div className="container">
          <article className="card stack-sm">
            {page.lastUpdated && <p className="meta">{dict.labels.updated}: {formatDateTime(page.lastUpdated, locale)}</p>}
            <RichText data={page.content} />
          </article>
        </div>
      </section>
    </main>
  )
}
