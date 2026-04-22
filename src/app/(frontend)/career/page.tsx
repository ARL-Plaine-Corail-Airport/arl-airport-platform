import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getCareerItemsWithSignedAttachments } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 60

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.career_title} - ${dict.common.airport_location}`,
    description: dict.pages.career_summary,
    path: '/career',
  })
}

function CareerIcon() {
  return (
    <svg
      width="36"
      height="36"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="m9 15 3 3 3-3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function getFileURL(file: unknown): string | null {
  if (!file || typeof file !== 'object') return null

  const url = (file as { url?: unknown }).url
  return typeof url === 'string' && url ? url : null
}

export default async function CareerPage() {
  const locale = await getLocale()
  const [dict, items] = await Promise.all([
    getDictionary(locale),
    getCareerItemsWithSignedAttachments(24, locale),
  ])

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_official_info}
        title={dict.pages.career_title}
        summary={dict.pages.career_summary}
      />
      <section className="page-section">
        <div className="container">
          {items.length ? (
            <div className="news-feed">
              {items.map((item: any) => (
                <article key={item.id ?? item.slug} className="news-item news-item--career">
                  <div className="news-item__career-icon">
                    <CareerIcon />
                  </div>

                  <div className="news-item__body">
                    <div className="news-item__meta">
                      <span className="pill pill--primary">{dict.pages.career_category}</span>
                      {item.isPinned && (
                        <span className="pill pill--danger">{dict.labels.featured}</span>
                      )}
                    </div>

                    <h2 className="news-item__title">{item.title}</h2>
                    {item.summary && <p className="news-item__summary">{item.summary}</p>}

                    {item.attachments?.length > 0 && (
                      <div className="news-item__links">
                        {item.attachments.map((att: any, i: number) => {
                          const fileUrl = getFileURL(att?.file)
                          if (!fileUrl) return null

                          const label = att.label || dict.pages.career_download_label
                          const fileId = typeof att.file === 'object' ? att.file?.id : undefined
                          const attachmentKey = att.id ?? fileId ?? `${item.id ?? item.slug}-att-${i}`

                          return (
                            <a
                              key={attachmentKey}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="news-item__download"
                              aria-label={`${label}: ${item.title}`}
                            >
                              <DownloadIcon />
                              {label}
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="card">
              <p className="meta">{dict.pages.no_careers}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
