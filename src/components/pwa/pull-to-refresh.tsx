'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 80
const MAX_PULL = 130

export function PullToRefresh() {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const pullDistanceRef = useRef(pullDistance)
  const refreshingRef = useRef(refreshing)

  useEffect(() => {
    pullDistanceRef.current = pullDistance
  }, [pullDistance])

  useEffect(() => {
    refreshingRef.current = refreshing
  }, [refreshing])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshingRef.current) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current) return
      if (window.scrollY > 0) return
      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        pullDistanceRef.current = 0
        setPullDistance(0)
        return
      }

      // Dampen the pull so it feels elastic
      const distance = Math.min(delta * 0.5, MAX_PULL)
      pullDistanceRef.current = distance
      setPullDistance(distance)
      if (distance > 10 && window.scrollY === 0) e.preventDefault()
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false

      if (pullDistanceRef.current >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true
        setRefreshing(true)
        pullDistanceRef.current = THRESHOLD
        setPullDistance(THRESHOLD)
        router.refresh()
        window.setTimeout(() => {
          refreshingRef.current = false
          setRefreshing(false)
          pullDistanceRef.current = 0
          setPullDistance(0)
        }, 600)
      } else {
        pullDistanceRef.current = 0
        setPullDistance(0)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [router])

  const active = pullDistance > 0 || refreshing
  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const pastThreshold = pullDistance >= THRESHOLD

  return (
    <div
      className="ptr-indicator"
      style={{
        transform: `translateY(${active ? pullDistance - 50 : -50}px)`,
        opacity: active ? progress : 0,
        pointerEvents: active ? 'auto' : 'none',
      }}
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
