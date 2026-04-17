import { render } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PwaResumeRefresh } from '@/components/pwa/pwa-resume-refresh'

let matchMediaMatches = true
let visibilityState: DocumentVisibilityState = 'visible'

describe('PwaResumeRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-06T10:00:00Z'))

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: matchMediaMatches,
        media: '(display-mode: standalone)',
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    })

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    matchMediaMatches = true
    visibilityState = 'visible'
  })

  it('emits a resume event when the standalone app regains focus', () => {
    const resumeListener = vi.fn()
    window.addEventListener('arl:pwa-resume', resumeListener)

    render(<PwaResumeRefresh />)

    act(() => {
      vi.advanceTimersByTime(6_000)
      window.dispatchEvent(new Event('focus'))
    })

    expect(resumeListener).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(1_000)
      window.dispatchEvent(new Event('focus'))
    })

    expect(resumeListener).toHaveBeenCalledTimes(1)
  })

  it('does not emit when not running in standalone mode', () => {
    matchMediaMatches = false

    const resumeListener = vi.fn()
    window.addEventListener('arl:pwa-resume', resumeListener)

    render(<PwaResumeRefresh />)

    act(() => {
      vi.advanceTimersByTime(6_000)
      window.dispatchEvent(new Event('focus'))
    })

    expect(resumeListener).not.toHaveBeenCalled()
  })

  it('does not emit when the document is hidden', () => {
    visibilityState = 'hidden'

    const resumeListener = vi.fn()
    window.addEventListener('arl:pwa-resume', resumeListener)

    render(<PwaResumeRefresh />)

    act(() => {
      vi.advanceTimersByTime(6_000)
      window.dispatchEvent(new Event('focus'))
    })

    expect(resumeListener).not.toHaveBeenCalled()
  })
})
