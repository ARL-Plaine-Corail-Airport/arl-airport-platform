'use client'

import { useEffect, useState } from 'react'

import { useI18n } from '@/i18n/provider'

export function OnlineStatus() {
  const { t } = useI18n()
  const [isOffline, setIsOffline] = useState(false)

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

  return (
    <div
      className={`online-status-banner${isOffline ? ' online-status-banner--visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {t('offline.banner')}
    </div>
  )
}
