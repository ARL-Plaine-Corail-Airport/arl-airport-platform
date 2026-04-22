'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'arl-nav-collapsed'

export default function NavToggle() {
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === 'true'
    document.documentElement.classList.toggle('nav-collapsed', stored)
    setCollapsed(stored)
    setHydrated(true)

    return () => {
      document.documentElement.classList.remove('nav-collapsed')
    }
  }, [])

  const apply = (next: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(next))
    document.documentElement.classList.toggle('nav-collapsed', next)
    setCollapsed(next)
  }

  if (!hydrated) return null

  return (
    <button
      type="button"
      onClick={() => apply(!collapsed)}
      className="nav-collapse-btn"
      aria-pressed={collapsed}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="currentColor"
        aria-hidden="true"
      >
        {collapsed
          ? <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
          : <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />}
      </svg>
    </button>
  )
}
