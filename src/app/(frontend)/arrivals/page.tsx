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
    title: `${dict.flights.arrivals_title} - ${dict.common.airport_location}`,
    description: dict.pages.arrivals_summary,
    path: '/arrivals',
  })
}

export default async function ArrivalsPage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([getDictionary(locale), getFlightBoard('arrivals')])

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_flights}
        title={dict.flights.arrivals_title}
        summary={dict.pages.arrivals_summary}
      />
      <section className="page-section">
        <div className="container">
          <FlightBoard data={data} />
        </div>
      </section>
    </main>
  )
}
