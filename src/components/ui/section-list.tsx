'use client'

import { RichText } from '@/components/ui/rich-text'
import { useI18n } from '@/i18n/provider'

function toSectionId(heading: string, index: number) {
  const slug = heading
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug || 'section'}-${index + 1}`
}

export function SectionList({ sections = [] }: { sections?: any[] | null }) {
  const { t } = useI18n()

  if (!sections?.length) {
    return (
      <section className="card">
        <p>{t('labels.no_sections')}</p>
      </section>
    )
  }

  const normalizedSections = sections.map((section, index) => ({
    ...section,
    id: toSectionId(section.heading ?? `section-${index + 1}`, index),
    order: String(index + 1).padStart(2, '0'),
  }))

  return (
    <div className="section-list">
      {normalizedSections.length > 1 ? (
        <nav className="section-list__nav" aria-label={t('nav.quick_links')}>
          <p className="section-list__nav-label">{t('nav.quick_links')}</p>
          <div className="section-list__nav-links">
            {normalizedSections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="section-list__nav-link">
                <span className="section-list__nav-index">{section.order}</span>
                <span>{section.heading}</span>
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      <div className="stack-lg">
        {normalizedSections.map((section) => (
          <section className="content-section" key={section.id} id={section.id}>
            <div className="content-section__header">
              <span className="content-section__number">{section.order}</span>
              <div>
                <h2 className="content-section__title">{section.heading}</h2>
              </div>
            </div>
            <RichText data={section.body} />
            {section.bullets?.length ? (
              <ul className="content-list">
                {section.bullets.map((bullet: any, bulletIndex: number) => (
                  <li key={bullet.id || `${section.id}-bullet-${bulletIndex}`}>{bullet.text}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}
