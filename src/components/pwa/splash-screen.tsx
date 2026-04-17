'use client'

import { useEffect, useState } from 'react'

const MIN_SPLASH_MS = 700
const FADE_OUT_MS = 500
const MAX_SPLASH_WAIT_MS = 2500
const PWA_DISPLAY_QUERY = '(display-mode: standalone)'

export function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false)
  const [isMounted, setIsMounted] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    let fadeTimer: ReturnType<typeof setTimeout> | null = null
    let removeTimer: ReturnType<typeof setTimeout> | null = null
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null
    let dismissalScheduled = false

    const isStandalone =
      window.matchMedia(PWA_DISPLAY_QUERY).matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (!isStandalone) {
      setIsMounted(false)
      return
    }

    root.dataset.pwaSplash = 'active'
    const startedAt = Date.now()

    const dismiss = () => {
      if (dismissalScheduled) return
      dismissalScheduled = true

      const remaining = Math.max(MIN_SPLASH_MS - (Date.now() - startedAt), 0)

      fadeTimer = setTimeout(() => {
        setFadeOut(true)
        removeTimer = setTimeout(() => {
          delete root.dataset.pwaSplash
          setIsMounted(false)
        }, FADE_OUT_MS)
      }, remaining)
    }

    const handleReady = () => {
      window.removeEventListener('load', handleReady)
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
      dismiss()
    }

    if (document.readyState === 'complete') {
      dismiss()
    } else {
      window.addEventListener('load', handleReady, { once: true })
      fallbackTimer = setTimeout(handleReady, MAX_SPLASH_WAIT_MS)
    }

    return () => {
      window.removeEventListener('load', handleReady)
      if (fadeTimer) clearTimeout(fadeTimer)
      if (removeTimer) clearTimeout(removeTimer)
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [])

  if (!isMounted) return null

  return (
    <div
      className={`splash-screen${fadeOut ? ' splash-screen--fade-out' : ''}`}
      aria-hidden="true"
    >
      <div className="splash-screen__halo" />
      <div className="splash-screen__signal" />
      <div className="splash-screen__content">
        <div className="splash-screen__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/arl-splash-logo.png"
            alt=""
            width={240}
            height={139}
          />
        </div>
        <p className="splash-screen__subtitle">Airport of Rodrigues Ltd</p>
        <div className="splash-screen__loader">
          <div className="splash-screen__loader-bar" />
        </div>
      </div>
    </div>
  )
}
