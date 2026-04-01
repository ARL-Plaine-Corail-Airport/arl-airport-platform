'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Only show splash in standalone (installed PWA) mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true

    if (!isStandalone) {
      setVisible(false)
      return
    }

    // Begin fade-out after content has loaded
    const timer = setTimeout(() => {
      setFadeOut(true)
    }, 1200)

    // Remove from DOM after animation
    const removeTimer = setTimeout(() => {
      setVisible(false)
    }, 1700)

    return () => {
      clearTimeout(timer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`splash-screen${fadeOut ? ' splash-screen--fade-out' : ''}`}
      aria-hidden="true"
    >
      <div className="splash-screen__content">
        <div className="splash-screen__icon">
          <svg width="80" height="80" viewBox="0 0 512 512" aria-hidden="true">
            <rect width="512" height="512" rx="96" fill="#fff" />
            <g transform="translate(256,256)">
              <path
                d="M0-180 C12-180 18-160 18-120 L18 140 C18 160 12 180 0 190 C-12 180 -18 160 -18 140 L-18-120 C-18-160 -12-180 0-180Z"
                fill="#114c7a"
              />
              <path d="M18-20 L160 30 C170 33 170 47 160 50 L18 20Z" fill="#114c7a" />
              <path d="M-18-20 L-160 30 C-170 33 -170 47 -160 50 L-18 20Z" fill="#114c7a" />
              <path d="M18 120 L80 155 C88 158 88 168 80 170 L18 150Z" fill="#114c7a" />
              <path d="M-18 120 L-80 155 C-88 158 -88 168 -80 170 L-18 150Z" fill="#114c7a" />
            </g>
          </svg>
        </div>
        <h1 className="splash-screen__title">Rodrigues Airport</h1>
        <p className="splash-screen__subtitle">Plaine Corail</p>
        <div className="splash-screen__loader">
          <div className="splash-screen__loader-bar" />
        </div>
      </div>
    </div>
  )
}
