import { MediaFigure } from '@/components/ui/media-figure'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getVIPLounge } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)
    return buildFrontendMetadata({
      locale,
      title: `${dict.pages.vip_title} - ${dict.common.airport_location}`,
      description: dict.pages.vip_summary,
      path: '/vip-lounge',
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

export default async function VIPLoungePage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([getDictionary(locale), getVIPLounge(locale)])
  const loungeImages = (data.loungeImages ?? [])
    .map((entry: { image?: unknown; id?: string | null }, index: number) => ({
      id: entry.id ?? `lounge-image-${index}`,
      image: entry.image,
    }))
    .filter((entry) => Boolean(entry.image))

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_premium}
        title={data.pageTitle ?? dict.pages.vip_title}
        summary={data.introduction ?? dict.pages.vip_summary}
      />

      <section className="page-section">
        <div className="container stack-lg">
          {loungeImages.length ? (
            <article className="card stack-sm">
              <h2>{dict.pages.lounge_gallery}</h2>
              <div className="media-gallery">
                {loungeImages.map((entry, index) => (
                  <MediaFigure
                    key={entry.id}
                    media={entry.image}
                    altFallback={`${data.pageTitle ?? dict.pages.vip_title} ${dict.labels.image} ${index + 1}`}
                    size="card"
                    variant="card"
                    showCaption
                    className="media-gallery__item"
                  />
                ))}
              </div>
            </article>
          ) : null}

          {data.amenities?.length ? (
            <article className="card">
              <div className="stack-sm">
                <h2>{dict.pages.lounge_amenities}</h2>
                <ul className="content-list">
                  {data.amenities.map((entry: { item: string }, index: number) => (
                    <li key={`amenity-${index}`}>{entry.item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ) : (
            <article className="card">
              <h2>{dict.pages.lounge_amenities}</h2>
              <p className="meta">{dict.pages.amenities_not_configured}</p>
            </article>
          )}

          <div className="callout-grid">
            {data.eligibility && (
              <article className="card">
                <div className="stack-sm">
                  <h2>{dict.pages.eligibility}</h2>
                  <p>{data.eligibility}</p>
                </div>
              </article>
            )}

            {data.bookingInformation && (
              <article className="card">
                <div className="stack-sm">
                  <h2>{dict.pages.booking_info}</h2>
                  <p>{data.bookingInformation}</p>
                </div>
              </article>
            )}
          </div>

          {(data.operatingHours || data.contactPhone || data.contactEmail) && (
            <article className="card">
              <div className="stack-sm">
                <h2>{dict.pages.contact_hours}</h2>
                {data.operatingHours && (
                  <p>
                    <strong>{dict.pages.operating_hours}:</strong> {data.operatingHours}
                  </p>
                )}
                {data.contactPhone && (
                  <p>
                    <strong>{dict.pages.phone}:</strong>{' '}
                    <a href={`tel:${data.contactPhone}`} className="text-link">
                      {data.contactPhone}
                    </a>
                  </p>
                )}
                {data.contactEmail && (
                  <p>
                    <strong>{dict.pages.email}:</strong>{' '}
                    <a href={`mailto:${data.contactEmail}`} className="text-link">
                      {data.contactEmail}
                    </a>
                  </p>
                )}
              </div>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
