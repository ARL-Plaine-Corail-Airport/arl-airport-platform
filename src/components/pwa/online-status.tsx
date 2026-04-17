'use client'

import { useEffect, useRef, useState } from 'react'

import { useI18n } from '@/i18n/provider'

export function OnlineStatus() {
  const { t } = useI18n()
  const [isOffline, setIsOffline] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement

    if (!isOffline) {
      root.style.setProperty('--online-status-offset', '0px')

      return () => {
        root.style.removeProperty('--online-status-offset')
      }
    }

    const updateOffset = () => {
      const height = bannerRef.current?.getBoundingClientRect().height ?? 0
      root.style.setProperty('--online-status-offset', `${Math.ceil(height)}px`)
    }

    updateOffset()
    window.addEventListener('resize', updateOffset)

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined' && bannerRef.current) {
      observer = new ResizeObserver(updateOffset)
      observer.observe(bannerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateOffset)
      observer?.disconnect()
      root.style.setProperty('--online-status-offset', '0px')
    }
  }, [isOffline])

  return (
    <div
      ref={bannerRef}
      className={`online-status-banner${isOffline ? ' online-status-banner--visible' : ''}`}
      role="status"
      aria-live="polite"
      suppressHydrationWarning
    >
      <span className="online-status-banner__dot" aria-hidden="true" />
      <span>{t('offline.banner')}</span>
    </div>
  )
}
