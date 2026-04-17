'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

export function ContentSlider({
  children,
  label,
  viewAllHref,
  viewAllLabel,
}: {
  children: React.ReactNode[]
  label: string
  viewAllHref: string
  viewAllLabel: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const childCount = children.length
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll])

  useEffect(() => {
    checkScroll()
  }, [checkScroll, childCount])

  function scroll(dir: 'left' | 'right') {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.slider-card') as HTMLElement | null
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="content-slider">
      <div className="content-slider__header">
        <span className="content-slider__label">{label}</span>
        <Link href={viewAllHref} className="content-slider__view-all">
          {viewAllLabel}
        </Link>
      </div>
      <div className="content-slider__wrapper">
        {canScrollLeft && (
          <button
            className="content-slider__arrow content-slider__arrow--left"
            onClick={() => scroll('left')}
            aria-label={`Scroll left in ${label}`}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="content-slider__track" ref={trackRef}>
          {children}
        </div>
        {canScrollRight && (
          <button
            className="content-slider__arrow content-slider__arrow--right"
            onClick={() => scroll('right')}
            aria-label={`Scroll right in ${label}`}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
