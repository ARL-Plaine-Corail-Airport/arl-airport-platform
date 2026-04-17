'use client'

import { useEffect, useRef } from 'react'

const INITIAL_GRACE_MS = 5_000
const MIN_RESUME_EVENT_GAP_MS = 10_000

function isStandaloneDisplayMode() {
  const nav = window.navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
}

export function PwaResumeRefresh() {
  const mountedAtRef = useRef(Date.now())
  const lastResumeEventAtRef = useRef(0)

  useEffect(() => {
    const emitResume = () => {
      if (!isStandaloneDisplayMode()) return
      if (document.visibilityState === 'hidden') return

      const now = Date.now()
      if (now - mountedAtRef.current < INITIAL_GRACE_MS) return
      if (now - lastResumeEventAtRef.current < MIN_RESUME_EVENT_GAP_MS) return

      lastResumeEventAtRef.current = now
      window.dispatchEvent(new Event('arl:pwa-resume'))
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      emitResume()
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      emitResume()
    }

    window.addEventListener('focus', emitResume)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', emitResume)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
