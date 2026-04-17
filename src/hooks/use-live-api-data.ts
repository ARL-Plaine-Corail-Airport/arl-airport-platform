'use client'

import { useEffect, useRef, useState } from 'react'

type UseLiveApiDataOptions<T> = {
  initialData: T
  minRefreshGapMs?: number
  refreshIntervalMs: number
  url: string
}

type RefreshReason =
  | 'focus'
  | 'interval'
  | 'mount'
  | 'online'
  | 'pwa-resume'
  | 'visibility'

const DEFAULT_MIN_REFRESH_GAP_MS = 5_000

export function useLiveApiData<T>({
  initialData,
  minRefreshGapMs = DEFAULT_MIN_REFRESH_GAP_MS,
  refreshIntervalMs,
  url,
}: UseLiveApiDataOptions<T>) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const lastRefreshStartedAtRef = useRef(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true

    const refresh = async (reason: RefreshReason) => {
      const now = Date.now()
      const shouldForce = reason === 'mount' || reason === 'interval' || reason === 'online'

      if (!shouldForce && now - lastRefreshStartedAtRef.current < minRefreshGapMs) {
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      lastRefreshStartedAtRef.current = now
      const requestId = ++requestIdRef.current

      try {
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Live API request failed with ${response.status}`)
        }

        const payload = (await response.json()) as T

        if (
          !mountedRef.current ||
          controller.signal.aborted ||
          requestId !== requestIdRef.current
        ) {
          return
        }

        setData(payload)
        setError(null)
      } catch (nextError: unknown) {
        const isAbortError =
          typeof nextError === 'object' &&
          nextError !== null &&
          (nextError as { name?: unknown }).name === 'AbortError'

        if (
          !mountedRef.current ||
          controller.signal.aborted ||
          requestId !== requestIdRef.current ||
          isAbortError
        ) {
          return
        }

        setError(
          nextError instanceof Error
            ? nextError
            : new Error('Failed to refresh live API data'),
        )
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    }

    const handleFocus = () => {
      if (document.visibilityState === 'hidden') return
      void refresh('focus')
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      void refresh('visibility')
    }

    const handleOnline = () => {
      void refresh('online')
    }

    const handlePwaResume = () => {
      if (document.visibilityState === 'hidden') return
      void refresh('pwa-resume')
    }

    void refresh('mount')

    const intervalId = window.setInterval(() => {
      void refresh('interval')
    }, refreshIntervalMs)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('arl:pwa-resume', handlePwaResume as EventListener)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mountedRef.current = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('arl:pwa-resume', handlePwaResume as EventListener)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      abortRef.current?.abort()
    }
  }, [minRefreshGapMs, refreshIntervalMs, url])

  return { data, error }
}
