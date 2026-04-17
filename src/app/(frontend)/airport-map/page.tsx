import { AirportMapLoader } from '@/components/ui/airport-map-loader'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getAirportMap } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)
    return buildFrontendMetadata({
      locale,
      title: `${dict.pages.airport_map_title} - ${dict.common.airport_location}`,
      description: dict.pages.airport_map_summary,
      path: '/airport-map',
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

export default async function AirportMapPage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([
    getDictionary(locale),
    getAirportMap(locale),
  ])

  const points = (data.points ?? []).map((p: any) => ({
    name: p.name ?? '',
    category: p.category ?? '',
    description: p.description ?? '',
    lat: p.lat ?? null,
    lng: p.lng ?? null,
  }))

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_wayfinding}
        title={data.introTitle}
        summary={data.introSummary}
      />
      <section className="page-section">
        <div className="container stack-lg">
          <AirportMapLoader
            points={points}
            labels={{
              points_of_interest: dict.pages.points_of_interest,
              no_points: dict.pages.no_points,
              locate_me: dict.pages.locate_me,
              locating: dict.pages.locating,
              location_error: dict.pages.location_error,
              airport_name: dict.map.airport_name,
              airport_full_name: dict.map.airport_full_name,
              your_location: dict.map.your_location,
              open_google_maps: dict.map.open_google_maps,
              category_labels: {
                terminal: dict.map.category_terminal,
                parking: dict.map.category_parking,
                transport: dict.map.category_transport,
                accessibility: dict.map.category_accessibility,
                security: dict.map.category_security,
                services: dict.map.category_services,
              },
            }}
          />
        </div>
      </section>
    </main>
  )
}
