'use client'

import { RichText } from '@/components/ui/rich-text'
import { useI18n } from '@/i18n/provider'

export function SectionList({ sections = [] }: { sections?: any[] | null }) {
  const { t } = useI18n()

  if (!sections?.length) {
    return (
      <section className="card">
        <p>{t('labels.no_sections')}</p>
      </section>
    )
  }

  return (
    <div className="stack-lg">
      {sections.map((section, index) => (
        <section className="card" key={`${section.heading}-${index}`}>
          <div className="stack-sm">
            <h2>{section.heading}</h2>
            <RichText data={section.body} />
            {section.bullets?.length ? (
              <ul className="content-list">
                {section.bullets.map((bullet: any, bulletIndex: number) => (
                  <li key={`${bullet.text}-${bulletIndex}`}>{bullet.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  )
}
