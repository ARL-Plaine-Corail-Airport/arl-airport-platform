import { MediaFigure } from '@/components/ui/media-figure'
import { PageHero } from '@/components/ui/page-hero'
import { SectionList } from '@/components/ui/section-list'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getPageBySlug } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)
    return buildFrontendMetadata({
      locale,
      title: `${dict.pages.amenities_title} - ${dict.common.airport_location}`,
      description: dict.pages.amenities_summary,
      path: '/amenities',
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

export default async function AmenitiesPage() {
  const locale = await getLocale()
  const [dict, page] = await Promise.all([getDictionary(locale), getPageBySlug('amenities', locale)])

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_airport_services}
        title={page?.title ?? dict.pages.amenities_title}
        summary={page?.summary ?? dict.pages.amenities_summary}
      />

      <section className="page-section">
        <div className="container">
          {page ? (
            <div className="stack-lg">
              <MediaFigure media={page.pageImage} altFallback={page.title} showCaption />
              <SectionList sections={page.sections} />
            </div>
          ) : (
            <article className="card">
              <p className="meta">{dict.pages.amenities_fallback}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
