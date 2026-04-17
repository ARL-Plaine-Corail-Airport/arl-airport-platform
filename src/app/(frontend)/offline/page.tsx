import Link from 'next/link'

import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.offline_title} - ${dict.common.airport_location}`,
    description: dict.pages.offline_summary,
    path: '/offline',
    robots: { index: false, follow: false },
  })
}

const CACHED_PAGES = [
  { path: '/passenger-guide', key: 'passenger_guide_title' },
  { path: '/contact', key: 'contact_title' },
  { path: '/faq', key: 'faq_title' },
  { path: '/airport-map', key: 'airport_map_title' },
  { path: '/transport-parking', key: 'transport_title' },
  { path: '/emergency-services', key: 'emergency_title' },
  { path: '/amenities', key: 'amenities_title' },
] as const

export default async function OfflinePage() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const lp = (path: string) => localePath(path, locale)
  const offlineDict = dict.offline

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_offline}
        title={dict.pages.offline_title}
        summary={dict.pages.offline_summary}
      />
      <section className="page-section">
        <div className="container" style={{ maxWidth: '40rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <a href={lp('/')} className="btn-primary">
              {offlineDict.retry ?? 'Retry connection'}
            </a>
          </div>

          <div className="card">
            <h2 className="card__title">{offlineDict.cached_pages ?? 'These pages may be available offline:'}</h2>
            <ul className="offline-links">
              {CACHED_PAGES.map(({ path, key }) => (
                <li key={path}>
                  <Link href={lp(path)} className="offline-links__item">
                    {dict.pages[key] ?? path}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="meta" style={{ marginTop: 'var(--space-md)' }}>
              {offlineDict.live_data_note ?? 'Live data such as flights and weather requires an internet connection.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
