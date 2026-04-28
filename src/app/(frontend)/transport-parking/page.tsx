import { PageHero } from '@/components/ui/page-hero'
import { SectionList } from '@/components/ui/section-list'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getTransportParking } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)
    return buildFrontendMetadata({
      locale,
      title: `${dict.pages.transport_title} - ${dict.common.airport_location}`,
      description: dict.pages.transport_summary,
      path: '/transport-parking',
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

export default async function TransportParkingPage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([
    getDictionary(locale),
    getTransportParking(locale),
  ])

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_passenger_access}
        title={data.introTitle}
        summary={data.introSummary}
      />
      <section className="page-section">
        <div className="container stack-lg">
          <SectionList sections={data.sections} />
        </div>
      </section>
    </main>
  )
}
