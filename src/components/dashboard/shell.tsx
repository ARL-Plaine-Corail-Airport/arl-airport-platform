'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavSection } from '@/lib/dashboard'

// ---------------------------------------------------------------------------
// SVG Icon Helper
// ---------------------------------------------------------------------------

function NavIcon({ name }: { name: string }) {
  const props = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...props}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      )
    case 'flights':
      return (
        <svg {...props}>
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2l-.4.9 6.8 2.7-1.7 3.5-3.2 1.5.2.8 4.7-1.2 2.7 6.8.9-.4z" />
        </svg>
      )
    case 'notices':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    case 'emergency':
      return (
        <svg {...props}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'weather':
      return (
        <svg {...props}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      )
    case 'pages':
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    case 'faqs':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'airlines':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    case 'amenities':
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'transport':
      return (
        <svg {...props}>
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      )
    case 'media':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    case 'users':
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...props}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

// ---------------------------------------------------------------------------
// Breadcrumb helper
// ---------------------------------------------------------------------------

function deriveBreadcrumb(pathname: string): { parent?: string; current: string } {
  const segments = pathname.replace(/^\//, '').split('/')
  const map: Record<string, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    flights: 'Flights',
    notices: 'Notices',
    emergency: 'Emergency Banners',
    weather: 'Weather',
    'pages-cms': 'Pages',
    faqs: 'FAQs',
    airlines: 'Airlines',
    amenities: 'Amenities & Services',
    transport: 'Transport & Parking',
    media: 'Media Library',
    users: 'Users & Roles',
    audit: 'Audit Log',
    settings: 'Settings',
  }

  if (segments.length === 1 && segments[0] === 'dashboard') {
    return { current: 'Dashboard' }
  }

  const last = segments[segments.length - 1]
  const label = map[last] ?? (last.charAt(0).toUpperCase() + last.slice(1))

  return { parent: 'Dashboard', current: label }
}

// ---------------------------------------------------------------------------
// Shell component props
// ---------------------------------------------------------------------------

export interface DashboardShellProps {
  navSections: NavSection[]
  user: {
    email: string
    fullName: string
    initials: string
    role: string
    roleLabel: string
    roleBadgeClass: string
  }
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Shell component
// ---------------------------------------------------------------------------

export function DashboardShell({ navSections, user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const breadcrumb = deriveBreadcrumb(pathname)

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        {/* Header / Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo" aria-hidden="true">
            ✈
          </div>
          <div className="sidebar-brand">
            <strong>ARL Admin</strong>
            <span>Airport of Rodrigues</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navSections.map((section) => (
            <div key={section.label} className="sidebar-section">
              <span className="sidebar-section-label">{section.label}</span>
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`sidebar-item${isActive(item.href) ? ' active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-avatar" aria-hidden="true">
            {user.initials}
          </div>
          <div className="sidebar-user">
            <span className="sidebar-user-info" title={user.fullName}>
              {user.fullName}
            </span>
            <span className="sidebar-user-email" title={user.email}>
              {user.email}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Top header */}
        <header className="top-header">
          <div className="top-header-left">
            {/* Mobile toggle */}
            <button
              className="menu-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <nav className="breadcrumb" aria-label="Breadcrumb">
              {breadcrumb.parent ? (
                <>
                  <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {breadcrumb.parent}
                  </Link>
                  <span className="breadcrumb-sep" aria-hidden="true">/</span>
                  <span className="breadcrumb-current">{breadcrumb.current}</span>
                </>
              ) : (
                <span className="breadcrumb-current">{breadcrumb.current}</span>
              )}
            </nav>
          </div>

          <div className="top-header-right">
            {/* Role badge */}
            <span className={`role-badge ${user.roleBadgeClass}`}>{user.roleLabel}</span>

            {/* Link back to Payload admin */}
            <Link
              href="/admin"
              className="header-btn"
              title="Open Payload Admin"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Payload Admin
            </Link>
          </div>
        </header>

        {/* Page content */}
        {children}
      </div>
    </div>
  )
}
