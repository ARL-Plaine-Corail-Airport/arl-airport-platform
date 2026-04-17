import { DetailCards } from '@/components/ui/detail-cards'
import { PageHero } from '@/components/ui/page-hero'
import { SectionList } from '@/components/ui/section-list'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getPassengerGuide } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.passenger_guide_title} - ${dict.common.airport_location}`,
    description: dict.pages.passenger_guide_summary,
    path: '/passenger-guide',
  })
}

export default async function PassengerGuidePage() {
  const locale = await getLocale()
  const [dict, guide] = await Promise.all([getDictionary(locale), getPassengerGuide(locale)])

  return (
    <main>
      <PageHero eyebrow={dict.pages.eyebrow_passenger_info} title={guide.introTitle} summary={guide.introSummary} />
      <section className="page-section">
        <div className="container stack-lg">
          <SectionList sections={guide.sections} />
          <section className="stack-sm">
            <h2>{dict.pages.useful_contacts}</h2>
            <DetailCards
              items={(guide.importantContacts || []).map((item: any) => ({
                title: item.label,
                value: item.value,
              }))}
            />
          </section>
        </div>
      </section>
    </main>
  )
}
