import { PageHero } from '@/components/ui/page-hero'
import { SectionList } from '@/components/ui/section-list'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getAccessibilityInfo } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.accessibility_title} - ${dict.common.airport_location}`,
    description: dict.pages.accessibility_summary,
    path: '/accessibility',
  })
}

export default async function AccessibilityPage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([getDictionary(locale), getAccessibilityInfo(locale)])

  return (
    <main>
      <PageHero eyebrow={dict.pages.eyebrow_accessibility} title={data.introTitle} summary={data.introSummary} />
      <section className="page-section">
        <div className="container stack-lg">
          <SectionList sections={data.sections} />
          {data.assistanceContact ? (
            <article className="card">
              <h2>{dict.pages.assistance_contact}</h2>
              <p>{data.assistanceContact}</p>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  )
}
