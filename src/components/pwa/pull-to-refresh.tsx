'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const THRESHOLD = 80
const MAX_PULL = 130

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  const isAtTop = useCallback(() => window.scrollY <= 0, [])

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isAtTop() || refreshing) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    },
    [isAtTop, refreshing],
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing) return
      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        setPullDistance(0)
        return
      }
      // Dampen the pull so it feels elastic
      const distance = Math.min(delta * 0.5, MAX_PULL)
      setPullDistance(distance)
      if (distance > 10) e.preventDefault()
    },
    [refreshing],
  )

  const onTouchEnd = useCallback(() => {
    if (!pulling.current) return
    pulling.current = false

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullDistance(THRESHOLD)
      window.location.reload()
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, refreshing])

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  if (pullDistance === 0 && !refreshing) return null

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const pastThreshold = pullDistance >= THRESHOLD

  return (
    <div
      className="ptr-indicator"
      style={{ transform: `translateY(${pullDistance - 50}px)`, opacity: progress }}
    >
      <svg
        className={`ptr-spinner${refreshing ? ' ptr-spinning' : ''}`}
        viewBox="0 0 24 24"
        width="28"
        height="28"
        style={{
          transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
        }}
      >
        <path
          d="M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"
          fill={pastThreshold ? 'var(--color-primary)' : 'var(--color-text-muted, #888)'}
        />
      </svg>
    </div>
  )
}
