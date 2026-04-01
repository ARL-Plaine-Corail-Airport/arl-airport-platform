import { DirectionsMapLoader } from '@/components/ui/directions-map-loader'
import { PageHero } from '@/components/ui/page-hero'
import { SectionList } from '@/components/ui/section-list'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getTransportParking } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.transport_title} - ${dict.common.airport_location}`,
    description: dict.pages.transport_summary,
    path: '/transport-parking',
  })
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
          <DirectionsMapLoader
            labels={{
              directions_title: dict.pages.directions_title,
              directions_desc: dict.pages.directions_desc,
              locate_me: dict.pages.locate_me,
              locating: dict.pages.locating,
              location_error: dict.pages.location_error,
              airport_name: (dict as any).map.airport_name,
              airport_terminal_desc: (dict as any).map.airport_terminal_desc,
              your_location: (dict as any).map.your_location,
              port_mathurin: (dict as any).map.port_mathurin,
              port_mathurin_desc: (dict as any).map.port_mathurin_desc,
              distance_info: (dict as any).map.distance_info,
              open_google_maps: (dict as any).map.open_google_maps,
            }}
          />
        </div>
      </section>
    </main>
  )
}
