import { FlightBoard } from '@/components/ui/flight-board'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getFlightBoard } from '@/lib/integrations/flights'
import { buildFrontendMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.flights.status_title} - ${dict.common.airport_location}`,
    description: dict.pages.flight_status_summary,
    path: '/flight-status',
  })
}

export default async function FlightStatusPage() {
  const locale = await getLocale()
  const [dict, arrivals, departures] = await Promise.all([
    getDictionary(locale),
    getFlightBoard('arrivals'),
    getFlightBoard('departures'),
  ])

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_flights}
        title={dict.flights.status_title}
        summary={dict.pages.flight_status_summary}
      />
      <section className="page-section">
        <div className="container stack-lg">
          <FlightBoard data={arrivals} />
          <FlightBoard data={departures} />
        </div>
      </section>
    </main>
  )
}
