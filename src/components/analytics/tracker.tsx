'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

function sendPageView(path: string, includeReferrer: boolean) {
  // Don't track admin/dashboard pages
  if (path.startsWith('/admin') || path.startsWith('/dashboard')) return

  // Only the browser's external referrer is sent; internal SPA navigations are intentionally counted as direct.
  const data = JSON.stringify({
    type: 'pageview',
    path,
    ...(includeReferrer && document.referrer ? { referrer: document.referrer } : {}),
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([data], { type: 'application/json' }))
  } else {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true,
    }).catch((error) => {
      console.debug('[analytics] Failed to send pageview', error)
    })
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    if (!pathname) return

    const isFirstPageView = lastPath.current === ''

    // Avoid double-tracking same page (React strict mode)
    if (pathname === lastPath.current) return
    lastPath.current = pathname

    sendPageView(pathname, isFirstPageView)
  }, [pathname])

  return null
}
