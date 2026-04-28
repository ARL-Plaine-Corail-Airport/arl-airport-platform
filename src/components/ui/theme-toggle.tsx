'use client'

import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'arl-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function getStoredTheme(): Theme | null {
  try {
    const theme = window.localStorage.getItem(STORAGE_KEY)
    return theme === 'light' || theme === 'dark' ? theme : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

const SunIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a7 7 0 1 0 11 11z" />
  </svg>
)

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const storedTheme = getStoredTheme()

    if (storedTheme) {
      applyTheme(storedTheme)
      setTheme(storedTheme)
      return
    }

    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia(DARK_QUERY)
      : null

    const syncSystemTheme = () => {
      const systemTheme = mediaQuery?.matches ? 'dark' : 'light'
      applyTheme(systemTheme)
      setTheme(systemTheme)
    }

    syncSystemTheme()
    mediaQuery?.addEventListener('change', syncSystemTheme)

    return () => {
      mediaQuery?.removeEventListener('change', syncSystemTheme)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'

      try {
        window.localStorage.setItem(STORAGE_KEY, nextTheme)
      } catch {
        // Keep the visual toggle functional even when storage is unavailable.
      }

      applyTheme(nextTheme)
      return nextTheme
    })
  }, [])

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? ' theme-toggle--dark' : ''}`}
      onClick={toggleTheme}
      aria-label={label}
      role="switch"
      aria-checked={isDark}
      title={label}
    >
      <span className="theme-toggle__thumb" aria-hidden="true">
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}
