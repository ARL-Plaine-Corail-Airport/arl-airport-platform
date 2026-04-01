'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '@/i18n/provider'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

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
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : undefined }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// ── Accessible dropdown ─────────────────────────────────────────────────────
// Supports: Enter/Space to toggle, Escape to close, arrow keys to navigate
// items, Tab to move focus out (auto-closes), click-outside to close.

function NavDropdown({
  label,
  items,
}: {
  label: string
  items: { href: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, close])

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      // Focus first item after render
      requestAnimationFrame(() => itemRefs.current[0]?.focus())
    }
  }

  function handleItemKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = index + 1
      if (next < items.length) {
        itemRefs.current[next]?.focus()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index === 0) {
        close()
      } else {
        itemRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const menuId = `dropdown-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="dropdown" ref={containerRef}>
      <button
        ref={triggerRef}
        className="nav-link"
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
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
        {items.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className="dropdown-item"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            ref={(el) => { itemRefs.current[i] = el }}
            onKeyDown={(e) => handleItemKeyDown(e, i)}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, localePath: lp } = useI18n()

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!menuOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          {/* Logo */}
          <Link href={lp('/')} className="logo-link" onClick={() => setMenuOpen(false)}>
            <div className="logo-box">
              <PlaneIcon size={18} color="white" />
            </div>
            <div className="hide-mobile">
              <span className="logo-name" style={{ display: 'block' }}>{t('common.airport_name')}</span>
              <span className="logo-sub" style={{ display: 'block' }}>{t('common.airport_full')}</span>
            </div>
            <span className="show-mobile-only logo-abbr">{t('common.airport_abbr')}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="nav-desktop" aria-label="Primary navigation">
            <NavDropdown
              label={t('nav.flights')}
              items={[
                { href: lp('/arrivals'), label: t('nav.arrivals') },
                { href: lp('/departures'), label: t('nav.departures') },
                { href: lp('/flight-status'), label: t('nav.flight_status') },
              ]}
            />

            <NavDropdown
              label={t('nav.passenger_info')}
              items={[
                { href: lp('/passenger-guide'), label: t('nav.passenger_guide') },
                { href: lp('/airport-map'), label: t('nav.airport_map') },
                { href: lp('/duty-free'), label: t('nav.duty_free') },
                { href: lp('/amenities'), label: t('nav.amenities') },
                { href: lp('/vip-lounge'), label: t('nav.vip_lounge') },
                { href: lp('/accessibility'), label: t('nav.accessibility') },
                { href: lp('/faq'), label: t('nav.faq') },
              ]}
            />

            <Link href={lp('/transport-parking')} className="nav-link">{t('nav.transport')}</Link>
            <Link href={lp('/notices')} className="nav-link">{t('nav.notices')}</Link>
            <Link href={lp('/news-events')} className="nav-link">{t('nav.news_events')}</Link>
            <Link href={lp('/airport-project')} className="nav-link">{t('nav.airport_project')}</Link>
            <Link href={lp('/contact')} className="nav-link">{t('nav.contact')}</Link>
          </nav>

          {/* Language switcher + Mobile toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LanguageSwitcher />

            <button
              className="mobile-toggle"
              aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-nav-menu"
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-label="Navigation menu"
      >
        <div className="mobile-menu__backdrop" onClick={() => setMenuOpen(false)} />
        <nav className="mobile-menu__panel" aria-label="Mobile navigation">
          <div className="mobile-menu__close">
            <button aria-label={t('nav.close_menu')} onClick={() => setMenuOpen(false)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick links — top-priority actions for mobile users */}
          <div className="mobile-nav-quick" role="group" aria-labelledby="mobile-quick-label">
            <p className="mobile-nav-group__label" id="mobile-quick-label">{t('nav.quick_links')}</p>
            <Link href={lp('/arrivals')} className="mobile-nav-quick__link" onClick={() => setMenuOpen(false)}>{t('nav.arrivals')}</Link>
            <Link href={lp('/departures')} className="mobile-nav-quick__link" onClick={() => setMenuOpen(false)}>{t('nav.departures')}</Link>
            <Link href={lp('/passenger-guide')} className="mobile-nav-quick__link" onClick={() => setMenuOpen(false)}>{t('nav.passenger_guide')}</Link>
            <Link href={lp('/contact')} className="mobile-nav-quick__link" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>
          </div>

          <div className="mobile-nav-group" role="group" aria-labelledby="mobile-flights-label">
            <p className="mobile-nav-group__label" id="mobile-flights-label">{t('nav.flights')}</p>
            <Link href={lp('/arrivals')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.arrivals')}</Link>
            <Link href={lp('/departures')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.departures')}</Link>
            <Link href={lp('/flight-status')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.flight_status')}</Link>
          </div>

          <div className="mobile-nav-group" role="group" aria-labelledby="mobile-passenger-label">
            <p className="mobile-nav-group__label" id="mobile-passenger-label">{t('nav.passenger_info')}</p>
            <Link href={lp('/passenger-guide')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.passenger_guide')}</Link>
            <Link href={lp('/airport-map')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.airport_map')}</Link>
            <Link href={lp('/duty-free')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.duty_free')}</Link>
            <Link href={lp('/amenities')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.amenities')}</Link>
            <Link href={lp('/vip-lounge')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.vip_lounge')}</Link>
            <Link href={lp('/accessibility')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.accessibility')}</Link>
            <Link href={lp('/faq')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.faq')}</Link>
          </div>

          <div className="mobile-nav-group" role="group" aria-labelledby="mobile-airport-label">
            <p className="mobile-nav-group__label" id="mobile-airport-label">{t('nav.airport')}</p>
            <Link href={lp('/transport-parking')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.transport_parking')}</Link>
            <Link href={lp('/notices')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.notices')}</Link>
            <Link href={lp('/news-events')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.news_events')}</Link>
            <Link href={lp('/airport-project')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.airport_project')}</Link>
            <Link href={lp('/contact')} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>
          </div>
        </nav>
      </div>
    </>
  )
}
