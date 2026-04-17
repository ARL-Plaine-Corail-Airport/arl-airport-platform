'use client'

import { useEffect } from 'react'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const AIRPORT_CACHE_PREFIX = 'arl-static-'
const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev'

export function shouldDisableServiceWorker(
  hostname: string,
  nodeEnv = process.env.NODE_ENV,
) {
  return nodeEnv !== 'production' || LOCAL_HOSTS.has(hostname)
}

export function getServiceWorkerUrl(buildVersion = BUILD_VERSION) {
  return `/sw.js?v=${encodeURIComponent(buildVersion)}`
}

async function clearAirportCaches() {
  if (!('caches' in window)) return

  const keys = await caches.keys()
  await Promise.all(
    keys
      .filter((key) => key.startsWith(AIRPORT_CACHE_PREFIX))
      .map((key) => caches.delete(key)),
  )
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const syncServiceWorker = async () => {
      if (shouldDisableServiceWorker(window.location.hostname)) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          )
        } catch (err) {
          console.warn('SW unregister failed:', err)
        }

        try {
          await clearAirportCaches()
        } catch (err) {
          console.warn('SW cache cleanup failed:', err)
        }

        return
      }

      try {
        const registration = await navigator.serviceWorker.register(getServiceWorkerUrl())
        await registration.update().catch(() => undefined)
      } catch (err) {
        console.warn('SW registration failed:', err)
      }
    }

    void syncServiceWorker()
  }, [])

  return null
}
