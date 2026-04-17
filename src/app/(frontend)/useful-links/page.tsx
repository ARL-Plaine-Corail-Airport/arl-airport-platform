import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getUsefulLinks } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.useful_links_title} - ${dict.common.airport_location}`,
    description: dict.pages.useful_links_summary,
    path: '/useful-links',
  })
}

export default async function UsefulLinksPage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([getDictionary(locale), getUsefulLinks(locale)])

  const groups = data.linkGroups ?? []

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_airport_info}
        title={data.pageTitle ?? dict.pages.useful_links_title}
        summary={data.introduction ?? dict.pages.useful_links_summary}
      />

      <section className="page-section">
        <div className="container stack-lg">
          {groups.length > 0 ? (
            groups.map((group: any) => (
              <div key={group.id || group.groupName}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                  {group.groupName}
                </h2>
                <div className="stack-sm">
                  {(group.links ?? []).map((link: any) => (
                    <a
                      key={link.id || link.url}
                      href={link.url}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="card"
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{link.label}</p>
                        {link.openInNewTab && (
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.4 }}>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                          </svg>
                        )}
                      </div>
                      {link.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                          {link.description}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <article className="card">
              <p>{dict.labels.no_records}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
