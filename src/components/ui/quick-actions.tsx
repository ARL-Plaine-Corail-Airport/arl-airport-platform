'use client'

import Link from 'next/link'

import { useI18n } from '@/i18n/provider'

const icons = {
  arrivals: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 22h20" />
      <path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.38-.24L4.29 11.15a2 2 0 0 1-.52-.38z" />
    </svg>
  ),
  departures: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 22h20" />
      <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l1.05-.53a2 2 0 0 1 2.15.18l6.3 4.73 4.45-2.22a2 2 0 0 1 2.55.88l.52.97a1 1 0 0 1-.58 1.4L7.3 17.12a2 2 0 0 1-.94.28z" />
    </svg>
  ),
  notices: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  transport: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  contact: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  map: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
}

const items = [
  { href: '/arrivals', key: 'arrivals' as const, icon: icons.arrivals },
  { href: '/departures', key: 'departures' as const, icon: icons.departures },
  { href: '/notices', key: 'notices' as const, icon: icons.notices },
  { href: '/transport-parking', key: 'transport' as const, icon: icons.transport },
  { href: '/contact', key: 'contact' as const, icon: icons.contact },
  { href: '/airport-map', key: 'map' as const, icon: icons.map },
]

export function QuickActions() {
  const { t, localePath: lp } = useI18n()

  return (
    <section className="quick-actions-section">
      <div className="container pull-up">
        <div className="quick-actions-grid">
          {items.map((item, i) => (
            <Link href={lp(item.href)} key={item.href} className={`quick-action-card${i < 2 ? ' quick-action-card--primary' : ''}`}>
              <div className="quick-action-card__icon">{item.icon}</div>
              <p className="quick-action-card__title">{t(`quick_actions.${item.key}`)}</p>
              <p className="quick-action-card__text hide-on-mobile">{t(`quick_actions.${item.key}_desc`)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
