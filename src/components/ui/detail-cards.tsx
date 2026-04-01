'use client'

import { useI18n } from '@/i18n/provider'

function getLinkLabel(href: string, t: (key: string) => string): string {
  if (href.startsWith('tel:')) return t('labels.call')
  if (href.startsWith('mailto:')) return t('labels.send_email')
  if (href.includes('maps') || href.includes('map')) return t('labels.view_on_map')
  return t('labels.open_link')
}

export function DetailCards({
  items = [],
}: {
  items?: Array<{ title?: string | null; value?: string | null; link?: string | null }>
}) {
  const { t } = useI18n()

  if (!items.length) {
    return (
      <section className="card">
        <p>{t('labels.no_records')}</p>
      </section>
    )
  }

  return (
    <section className="card-grid">
      {items.map((item, index) => (
        <article className="card" key={`${item.title}-${index}`}>
          <div className="stack-sm">
            <h2>{item.title ?? ''}</h2>
            <p>{item.value ?? ''}</p>
            {item.link ? (
              <a href={item.link} className="text-link" target={item.link.startsWith('tel:') || item.link.startsWith('mailto:') ? undefined : '_blank'} rel={item.link.startsWith('tel:') || item.link.startsWith('mailto:') ? undefined : 'noreferrer'}>
                {getLinkLabel(item.link, t)}
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}
