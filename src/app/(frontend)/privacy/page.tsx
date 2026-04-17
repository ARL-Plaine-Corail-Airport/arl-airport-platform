import { PageHero } from '@/components/ui/page-hero'
import { RichText } from '@/components/ui/rich-text'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { formatDateTime } from '@/lib/date'
import { getLegalPages } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.privacy_title} - ${dict.common.airport_location}`,
    description: dict.pages.privacy_summary,
    path: '/privacy',
  })
}

export default async function PrivacyPage() {
  const locale = await getLocale()
  const [dict, legal] = await Promise.all([getDictionary(locale), getLegalPages(locale)])
  const page = legal.privacyPolicy

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_legal}
        title={page.title ?? dict.pages.privacy_title}
        summary={dict.pages.privacy_summary}
      />
      <section className="page-section">
        <div className="container stack-lg">
          <article className="card stack-sm">
            {page.lastUpdated && <p className="meta">{dict.labels.updated}: {formatDateTime(page.lastUpdated, locale)}</p>}
            <RichText data={page.content} />
          </article>

          {(page.dataControllerName || page.dataControllerEmail) && (
            <article className="card stack-sm">
              <h2>{dict.pages.data_controller}</h2>
              {page.dataControllerName && <p>{page.dataControllerName}</p>}
              {page.dataControllerEmail && (
                <p>
                  <a href={`mailto:${page.dataControllerEmail}`} className="text-link">
                    {page.dataControllerEmail}
                  </a>
                </p>
              )}
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
