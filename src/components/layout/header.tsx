'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useI18n } from '@/i18n/provider'

const PlaneIcon = ({ size = 20, color = 'white' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.5 7.3c.3.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
  </svg>
)

const ChevronIcon = ({ open }: { open?: boolean }) => (
  <svg
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={`nav-chevron${open ? ' nav-chevron--open' : ''}`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const UtilityIcon = ({ path }: { path: 'dot' | 'map' | 'flight' | 'phone' }) => {
  if (path === 'dot') return <span className="site-header__status-dot" aria-hidden="true" />

  const icons = {
    flight: <path d="M2 22h20M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l1.05-.53a2 2 0 0 1 2.15.18l6.3 4.73 4.45-2.22a2 2 0 0 1 2.55.88l.52.97a1 1 0 0 1-.58 1.4L7.3 17.12a2 2 0 0 1-.94.28z" />,
    map: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  }

  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      {icons[path]}
    </svg>
  )
}

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavDropdown({
  active,
  items,
  label,
}: {
  active?: boolean
  items: { href: string; label: string }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return

    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [close, open])

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      requestAnimationFrame(() => itemRefs.current[0]?.focus())
    }
  }

  function handleItemKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = index + 1
      if (next < items.length) itemRefs.current[next]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (index === 0) {
        close()
      } else {
        itemRefs.current[index - 1]?.focus()
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  const menuId = `dropdown-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="dropdown" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`nav-link nav-dropdown-btn${active ? ' nav-link--active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
      >
        {label} <ChevronIcon open={open} />
      </button>
      <div
        id={menuId}
        className="dropdown-menu"
        role="menu"
        aria-label={label}
        style={{ display: open ? 'block' : undefined }}
      >
        {items.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className="dropdown-item"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            ref={(element) => {
              itemRefs.current[index] = element
            }}
            onKeyDown={(event) => handleItemKeyDown(event, index)}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SiteHeader({ phone }: { phone?: string }) {
  const pathname = usePathname() ?? '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, localePath: lp } = useI18n()

  const flightLinks = [
    { href: lp('/arrivals'), label: t('nav.arrivals') },
    { href: lp('/departures'), label: t('nav.departures') },
    { href: lp('/flight-status'), label: t('nav.flight_status') },
  ]

  const passengerLinks = [
    { href: lp('/passenger-guide'), label: t('nav.passenger_guide') },
    { href: lp('/airport-map'), label: t('nav.airport_map') },
    { href: lp('/duty-free'), label: t('nav.duty_free') },
    { href: lp('/amenities'), label: t('nav.amenities') },
    { href: lp('/vip-lounge'), label: t('nav.vip_lounge') },
    { href: lp('/accessibility'), label: t('nav.accessibility') },
    { href: lp('/faq'), label: t('nav.faq') },
  ]

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const flightsActive = ['/arrivals', '/departures', '/flight-status'].some((href) =>
    isPathActive(pathname, href),
  )

  const passengerActive = [
    '/passenger-guide',
    '/airport-map',
    '/duty-free',
    '/amenities',
    '/vip-lounge',
    '/accessibility',
    '/faq',
  ].some((href) => isPathActive(pathname, href))

  return (
    <>
      <header className="site-header">
        <div className="site-header__meta">
          <div className="container site-header__meta-inner">
            <p className="site-header__status">
              <UtilityIcon path="dot" />
              {t('flights.live_data')}
            </p>
            <div className="site-header__meta-links">
              <Link href={lp('/flight-status')} className="site-header__meta-link">
                <UtilityIcon path="flight" />
                {t('nav.flight_status')}
              </Link>
              <Link href={lp('/airport-map')} className="site-header__meta-link">
                <UtilityIcon path="map" />
                {t('nav.airport_map')}
              </Link>
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="site-header__meta-link site-header__meta-link--accent"
                >
                  <UtilityIcon path="phone" />
                  {phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="container site-header__inner">
          <Link href={lp('/')} className="logo-link" onClick={() => setMenuOpen(false)}>
            <div className="logo-box logo-box--rect">
              <Image
                src="/images/ARL airport logo with airplane graphic.png"
                alt={t('common.airport_name')}
                width={120}
                height={40}
                className="logo-img"
              />
            </div>
            <div className="hide-mobile">
              <span className="logo-name logo-text-block">{t('common.airport_name')}</span>
              <span className="logo-sub logo-text-block">{t('common.airport_full')}</span>
            </div>
            <span className="show-mobile-only logo-abbr">{t('common.airport_abbr')}</span>
          </Link>

          <nav className="nav-desktop" aria-label="Primary navigation">
            <NavDropdown active={flightsActive} label={t('nav.flights')} items={flightLinks} />
            <NavDropdown
              active={passengerActive}
              label={t('nav.passenger_info')}
              items={passengerLinks}
            />
            <Link
              href={lp('/transport-parking')}
              className={`nav-link${isPathActive(pathname, '/transport-parking') ? ' nav-link--active' : ''}`}
            >
              {t('nav.transport')}
            </Link>
            <Link
              href={lp('/notices')}
              className={`nav-link${isPathActive(pathname, '/notices') ? ' nav-link--active' : ''}`}
            >
              {t('nav.notices')}
            </Link>
            <Link
              href={lp('/news-events')}
              className={`nav-link${isPathActive(pathname, '/news-events') ? ' nav-link--active' : ''}`}
            >
              {t('nav.news_events')}
            </Link>
            <Link
              href={lp('/airport-project')}
              className={`nav-link${isPathActive(pathname, '/airport-project') ? ' nav-link--active' : ''}`}
            >
              {t('nav.airport_project')}
            </Link>
            <Link
              href={lp('/contact')}
              className={`nav-link${isPathActive(pathname, '/contact') ? ' nav-link--active' : ''}`}
            >
              {t('nav.contact')}
            </Link>
          </nav>

          <div className="header-actions">
            <LanguageSwitcher />

            <button
              type="button"
              className="mobile-toggle"
              aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d={menuOpen ? 'M18 6 6 18M6 6l12 12' : 'M3 12h18M3 6h18M3 18h18'} />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-nav-menu"
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-label="Navigation menu"
      >
        <div
          className="mobile-menu__backdrop"
          role="presentation"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
        <nav className="mobile-menu__panel" aria-label="Mobile navigation">
          <div className="mobile-menu__close">
            <button type="button" aria-label={t('nav.close_menu')} onClick={() => setMenuOpen(false)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mobile-nav-quick" role="group" aria-labelledby="mobile-quick-label">
            <p className="mobile-nav-group__label" id="mobile-quick-label">{t('nav.quick_links')}</p>
            <Link href={lp('/arrivals')} className="mobile-nav-quick__link">{t('nav.arrivals')}</Link>
            <Link href={lp('/departures')} className="mobile-nav-quick__link">{t('nav.departures')}</Link>
            <Link href={lp('/passenger-guide')} className="mobile-nav-quick__link">{t('nav.passenger_guide')}</Link>
            <Link href={lp('/contact')} className="mobile-nav-quick__link">{t('nav.contact')}</Link>
          </div>

          <div className="mobile-nav-group" role="group" aria-labelledby="mobile-flights-label">
            <p className="mobile-nav-group__label" id="mobile-flights-label">{t('nav.flights')}</p>
            {flightLinks.map((item) => (
              <Link key={item.href} href={item.href} className="mobile-nav-link">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mobile-nav-group" role="group" aria-labelledby="mobile-passenger-label">
            <p className="mobile-nav-group__label" id="mobile-passenger-label">{t('nav.passenger_info')}</p>
            {passengerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="mobile-nav-link">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mobile-nav-group" role="group" aria-labelledby="mobile-airport-label">
            <p className="mobile-nav-group__label" id="mobile-airport-label">{t('nav.airport')}</p>
            <Link href={lp('/transport-parking')} className="mobile-nav-link">{t('nav.transport_parking')}</Link>
            <Link href={lp('/notices')} className="mobile-nav-link">{t('nav.notices')}</Link>
            <Link href={lp('/news-events')} className="mobile-nav-link">{t('nav.news_events')}</Link>
            <Link href={lp('/airport-project')} className="mobile-nav-link">{t('nav.airport_project')}</Link>
            <Link href={lp('/contact')} className="mobile-nav-link">{t('nav.contact')}</Link>
          </div>
        </nav>
      </div>
    </>
  )
}
