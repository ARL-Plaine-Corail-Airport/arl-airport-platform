'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

function sendPageView(path: string) {
  // Don't track admin/dashboard pages
  if (path.startsWith('/admin') || path.startsWith('/dashboard')) return

  const data = JSON.stringify({
    path,
    referrer: document.referrer || null,
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([data], { type: 'application/json' }))
  } else {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true,
    }).catch(() => {})
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    // Avoid double-tracking same page (React strict mode)
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    sendPageView(pathname)
  }, [pathname])

  return null
}
