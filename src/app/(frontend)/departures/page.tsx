import { FlightBoardLive } from '@/components/ui/flight-board-live'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getFlightBoard } from '@/lib/integrations/flights'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 2600

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.flights.departures_title} - ${dict.common.airport_location}`,
    description: dict.pages.departures_summary,
    path: '/departures',
  })
}

export default async function DeparturesPage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([getDictionary(locale), getFlightBoard('departures')])

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_flights}
        title={dict.flights.departures_title}
        summary={dict.pages.departures_summary}
      />
      <section className="page-section">
        <div className="container">
          <FlightBoardLive boardType="departures" initialData={data} />
        </div>
      </section>
    </main>
  )
}
