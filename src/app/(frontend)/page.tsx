import Link from 'next/link'

import { ContentSlider } from '@/components/ui/content-slider'
import { EmergencyBanner } from '@/components/ui/emergency-banner'
import { FlightBoardPreview } from '@/components/ui/flight-board-preview'
import { PageHero } from '@/components/ui/page-hero'
import { QuickActions } from '@/components/ui/quick-actions'
import { WeatherPreview } from '@/components/ui/weather-preview'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { formatDateTime } from '@/lib/date'
import {
  getHomePage,
  getLatestNotices,
  getNewsEvents,
  getPromotedEmergencyNotice,
  getSiteSettings,
} from '@/lib/content'
import { getFlightBoard } from '@/lib/integrations/flights'
import { getWeatherSnapshot } from '@/lib/integrations/weather'
import { buildFrontendMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: dict.pages.home_meta_title,
    description: dict.pages.home_meta_description,
    path: '/',
  })
}

export default async function HomePage() {
  const locale = await getLocale()
  const [dict, site, home, notices, newsItems, emergencyNotice, arrivalsData, departuresData, weather] =
    await Promise.all([
      getDictionary(locale),
      getSiteSettings(locale),
      getHomePage(locale),
      getLatestNotices(8, locale),
      getNewsEvents(8, locale),
      getPromotedEmergencyNotice(locale),
      getFlightBoard('arrivals'),
      getFlightBoard('departures'),
      getWeatherSnapshot(),
    ])

  const d = dict.home
  const alertTitle = emergencyNotice?.title ?? home.emergencyAlertTitle
  const alertSummary = emergencyNotice?.summary ?? home.emergencyAlertBody
  const lp = (path: string) => localePath(path, locale)

  return (
    <main className="site-main">
      {/* â”€â”€ Urgent banner â”€â”€ */}
      <EmergencyBanner
        title={alertTitle ?? undefined}
        summary={alertSummary ?? undefined}
        href={lp('/notices')}
      />

      {/* â”€â”€ Hero â”€â”€ */}
      <PageHero
        eyebrow={site.siteName}
        title={d.hero_title}
        summary={d.hero_summary}
        meta={dict.common.hero_meta}
        variant="home"
      />

      {/* â”€â”€ Quick actions (pull-up) â”€â”€ */}
      <QuickActions />

      {/* â”€â”€ Flight preview â”€â”€ */}
      <FlightBoardPreview arrivals={arrivalsData} departures={departuresData} />

      {/* â”€â”€ Notices & News sliders â”€â”€ */}
      <section className="section section-alt">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Notices slider */}
          {notices.length > 0 ? (
            <ContentSlider label={d.notices_title} viewAllHref={lp('/notices')} viewAllLabel={d.all_notices}>
              {notices.map((notice: any) => (
                <Link key={notice.id} href={lp(`/notices/${notice.slug}`)} className="slider-card">
                  <div className="slider-card__meta">
                    {notice.category && <span className="pill">{(dict as any).notice_categories?.[notice.category] ?? notice.category}</span>}
                    {notice.urgent && <span className="pill pill--danger">{dict.labels.urgent}</span>}
                    {notice.pinned && <span className="pill" style={{ background: 'var(--primary)', color: 'white' }}>{dict.labels.pinned}</span>}
                  </div>
                  <p className="slider-card__title">{notice.title}</p>
                  {notice.summary && <p className="slider-card__summary">{notice.summary}</p>}
                  {notice.publishedAt && <p className="slider-card__date">{formatDateTime(notice.publishedAt, locale)}</p>}
                </Link>
              ))}
            </ContentSlider>
          ) : (
            <p className="empty-state">{d.no_notices}</p>
          )}

          {/* News & Events slider */}
          {newsItems.length > 0 ? (
            <ContentSlider label={d.news_title} viewAllHref={lp('/news-events')} viewAllLabel={d.all_news}>
              {newsItems.map((item: any) => (
                <Link key={item.id} href={lp(`/news-events/${item.slug}`)} className="slider-card">
                  <div className="slider-card__meta">
                    {item.type && <span className="pill">{(dict as any).news_types?.[item.type] ?? item.type}</span>}
                    {item.isPinned && <span className="pill pill--danger">{dict.labels.featured}</span>}
                  </div>
                  <p className="slider-card__title">{item.title}</p>
                  {item.summary && <p className="slider-card__summary">{item.summary}</p>}
                  {item.publishedAt && <p className="slider-card__date">{formatDateTime(item.publishedAt, locale)}</p>}
                </Link>
              ))}
            </ContentSlider>
          ) : (
            <p className="empty-state">{d.no_news}</p>
          )}
        </div>
      </section>

      {/* â”€â”€ Services + Weather â”€â”€ */}
      <section className="section">
        <div className="container">
          <div className="services-layout">
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{d.services_title}</h2>
              <div className="services-grid">
                <Link href={lp('/passenger-guide')} className="service-card">
                  <div className="icon-box">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 20h0a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h0" />
                      <path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />
                      <path d="M10 20h4" />
                      <circle cx="16" cy="20" r="2" />
                      <circle cx="8" cy="20" r="2" />
                    </svg>
                  </div>
                  <div>
                    <p className="service-card__title">{dict.nav.passenger_guide}</p>
                    <p className="service-card__desc">{d.guide_desc}</p>
                  </div>
                </Link>

                <Link href={lp('/transport-parking')} className="service-card">
                  <div className="icon-box">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <path d="M9 17h6" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                  <div>
                    <p className="service-card__title">{dict.nav.transport_parking}</p>
                    <p className="service-card__desc">{d.transport_desc}</p>
                  </div>
                </Link>

                <Link href={lp('/accessibility')} className="service-card">
                  <div className="icon-box">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="service-card__title">{dict.nav.accessibility}</p>
                    <p className="service-card__desc">{d.accessibility_desc}</p>
                  </div>
                </Link>

                <Link href={lp('/faq')} className="service-card">
                  <div className="icon-box">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="service-card__title">{dict.nav.faq}</p>
                    <p className="service-card__desc">{d.faq_desc}</p>
                  </div>
                </Link>
              </div>
            </div>

            <WeatherPreview weather={weather} />
          </div>
        </div>
      </section>

      {/* â”€â”€ Map + Emergency â”€â”€ */}
      <section className="section section-alt">
        <div className="container">
          <div className="map-emergency-grid">
            {/* Airport location */}
            <Link href={lp('/airport-map')} className="map-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <svg width="20" height="20" fill="none" stroke="var(--primary)" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{d.location_title}</h2>
              </div>
              <div className="map-placeholder">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" style={{ opacity: 0.4 }}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p>{d.view_map}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{d.location_sub}</p>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, marginTop: '0.75rem' }}>
                {d.open_map}
              </p>
            </Link>

            {/* Emergency info */}
            <div className="emergency-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <svg width="20" height="20" fill="none" stroke="var(--danger)" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{d.emergency_title}</h2>
              </div>

              <div className="alert-info">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span>{d.emergency_notice}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="emergency-contact-row">
                  <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{d.emergency_line}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{site.primaryPhone ?? d.emergency_line_number}</span>
                </div>
                <div className="emergency-contact-row">
                  <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{d.police}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.police_number}</span>
                </div>
                <div className="emergency-contact-row" style={{ borderBottom: 'none' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{d.samu}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.samu_number}</span>
                </div>
              </div>

              <Link href={lp('/emergency-services')} className="text-link" style={{ display: 'block', marginTop: '1rem', fontSize: '0.75rem' }}>
                {d.view_emergency}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ Contact strip â”€â”€ */}
      <section className="section">
        <div className="container contact-strip">
          <h2>{d.need_help}</h2>
          <p>{d.help_desk_hours}</p>
          <div className="contact-strip__actions">
            <a href={`tel:${site.primaryPhone ?? d.help_desk_phone}`} className="btn-primary">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {d.call_help}
            </a>
            <Link href={lp('/contact')} className="btn-outline">{d.contact_info}</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
