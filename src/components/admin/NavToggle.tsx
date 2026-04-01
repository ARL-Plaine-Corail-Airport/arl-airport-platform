'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const STORAGE_KEY = 'arl-nav-collapsed'

export default function NavToggle() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const applyCollapsedState = (next: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(next))
    document.documentElement.classList.toggle('nav-collapsed', next)
    setCollapsed(next)
  }

  useEffect(() => {
    setMounted(true)

    const stored = localStorage.getItem(STORAGE_KEY) === 'true'
    document.documentElement.classList.toggle('nav-collapsed', stored)
    setCollapsed(stored)
  }, [])

  if (!mounted) {
    return null
  }

  return createPortal(
    <button
      type="button"
      onClick={() => applyCollapsedState(!collapsed)}
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
        {collapsed ? (
          /* chevron-right: expand */
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
        ) : (
          /* chevron-left: collapse */
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
        )}
      </svg>
    </button>,
    document.body,
  )
}
