'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useI18n } from '@/i18n/provider'

type FooterProps = {
  currentYear: number
  phone?: string
  email?: string
  address?: string
  workingHours?: string
  socialLinks?: Array<{ label?: string; url?: string }>
}

export function SiteFooter({
  currentYear,
  phone,
  email,
  address,
  workingHours,
  socialLinks,
}: FooterProps) {
  const { t, localePath: lp } = useI18n()
  const filteredSocialLinks = (socialLinks ?? []).filter(
    (social) => typeof social.url === 'string' && social.url.trim().length > 0,
  )

  const hasSocialLinks = filteredSocialLinks.length > 0

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-callout">
          <div className="footer-callout__inner">
            <div>
              <p className="footer-callout__eyebrow">{t('nav.quick_links')}</p>
              <h2 className="footer-callout__title">{t('common.airport_name')}</h2>
              <p className="footer-callout__copy">{t('pages.contact_summary')}</p>
            </div>
            <div className="footer-callout__actions">
              <Link href={lp('/flight-status')} prefetch={false} className="footer-callout__action">
                <span>{t('nav.flight_status')}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
              <Link href={lp('/airport-map')} prefetch={false} className="footer-callout__action">
                <span>{t('nav.airport_map')}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
              <Link href={lp('/contact')} prefetch={false} className="footer-callout__action">
                <span>{t('nav.contact')}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-grid">
          {/* Brand + contact */}
          <div>
            <div className="footer-brand">
              <div className="footer-logo-box">
                <Image
                  src="/images/arl-footer-logo.jpg"
                  alt={t('common.airport_company')}
                  width={823}
                  height={209}
                  className="footer-logo-image"
                  sizes="(max-width: 767px) 220px, 260px"
                />
              </div>
              <p className="footer-brand__sub footer-brand__sub--location">{t('common.airport_location')}</p>
            </div>

            <div className="footer-contact-list">
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="footer-contact-item">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="footer-contact-item">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {email}
                </a>
              )}
              {address && (
                <p className="footer-contact-item">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {address}
                </p>
              )}
              {workingHours && (
                <p className="footer-contact-item">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {workingHours}
                </p>
              )}
            </div>

            {hasSocialLinks && (
              <div className="footer-socials">
                {filteredSocialLinks.map((social) => {
                  const url = social.url?.trim()
                  if (!url) return null
                  const label = (social.label ?? '').toLowerCase()
                  return (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label={social.label ?? 'Social'}>
                      {label.includes('facebook') ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      ) : label.includes('instagram') ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      ) : label.includes('x') || label.includes('twitter') ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      ) : label.includes('youtube') ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
                        </svg>
                      ) : label.includes('tiktok') ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      )}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Flights */}
          <div>
            <h3 className="footer-heading">{t('footer.flights')}</h3>
            <Link href={lp('/arrivals')} prefetch={false} className="footer-link">{t('nav.arrivals')}</Link>
            <Link href={lp('/departures')} prefetch={false} className="footer-link">{t('nav.departures')}</Link>
            <Link href={lp('/flight-status')} prefetch={false} className="footer-link">{t('nav.flight_status')}</Link>
          </div>

          {/* Passenger Info */}
          <div>
            <h3 className="footer-heading">{t('footer.passenger_info')}</h3>
            <Link href={lp('/passenger-guide')} prefetch={false} className="footer-link">{t('nav.passenger_guide')}</Link>
            <Link href={lp('/transport-parking')} prefetch={false} className="footer-link">{t('nav.transport_parking')}</Link>
            <Link href={lp('/airport-map')} prefetch={false} className="footer-link">{t('nav.airport_map')}</Link>
            <Link href={lp('/amenities')} prefetch={false} className="footer-link">{t('nav.amenities')}</Link>
            <Link href={lp('/vip-lounge')} prefetch={false} className="footer-link">{t('nav.vip_lounge')}</Link>
            <Link href={lp('/accessibility')} prefetch={false} className="footer-link">{t('nav.accessibility')}</Link>
            <Link href={lp('/faq')} prefetch={false} className="footer-link">{t('nav.faq')}</Link>
          </div>

          {/* Airport */}
          <div>
            <h3 className="footer-heading">{t('footer.airport')}</h3>
            <Link href={lp('/notices')} prefetch={false} className="footer-link">{t('nav.notices')}</Link>
            <Link href={lp('/news-events')} prefetch={false} className="footer-link">{t('nav.news_events')}</Link>
            <Link href={lp('/career')} prefetch={false} className="footer-link">{t('nav.career')}</Link>
            <Link href={lp('/useful-links')} prefetch={false} className="footer-link">{t('nav.useful_links')}</Link>
            <Link href={lp('/contact')} prefetch={false} className="footer-link">{t('nav.contact')}</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.copyright').replace('{year}', String(currentYear))}</p>
          <div className="footer-legal">
            <Link href={lp('/terms-conditions')} prefetch={false} className="footer-link footer-link--inline">{t('footer.terms')}</Link>
            <Link href={lp('/privacy')} prefetch={false} className="footer-link footer-link--inline">{t('footer.privacy')}</Link>
            <Link href={lp('/disclaimer')} prefetch={false} className="footer-link footer-link--inline">{t('footer.disclaimer')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
