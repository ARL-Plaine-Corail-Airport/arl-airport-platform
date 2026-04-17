'use client'

import { useI18n } from '@/i18n/provider'

function getLinkLabel(href: string, t: (key: string) => string): string {
  if (href.startsWith('tel:')) return t('labels.call')
  if (href.startsWith('mailto:')) return t('labels.send_email')
  if (href.includes('maps') || href.includes('map')) return t('labels.view_on_map')
  return t('labels.open_link')
}

function getLinkAriaLabel(href: string, t: (key: string) => string): string {
  const label = getLinkLabel(href, t)
  const opensInNewTab = !href.startsWith('tel:') && !href.startsWith('mailto:')
  return opensInNewTab ? `${label} (opens in new tab)` : label
}

export function DetailCards({
  items = [],
}: {
  items?: Array<{ id: string; title?: string | null; value?: string | null; link?: string | null }>
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
      {items.map((item) => (
        <article className="detail-card" key={item.id}>
          <p className="detail-card__label">{item.title ?? ''}</p>
          <p className="detail-card__value">{item.value ?? ''}</p>
          {item.link ? (
            <a
              href={item.link}
              className="detail-card__link"
              target={item.link.startsWith('tel:') || item.link.startsWith('mailto:') ? undefined : '_blank'}
              rel={item.link.startsWith('tel:') || item.link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              aria-label={getLinkAriaLabel(item.link, t)}
            >
              {getLinkLabel(item.link, t)}
            </a>
          ) : null}
        </article>
      ))}
    </section>
  )
}
