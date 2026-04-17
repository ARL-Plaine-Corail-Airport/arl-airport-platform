import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnalyticsTracker } from '@/components/analytics/tracker'

let currentPathname = '/contact'

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}))

describe('AnalyticsTracker', () => {
  beforeEach(() => {
    currentPathname = '/contact'
    window.history.replaceState({}, '', '/fr/contact')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the browser-visible locale-prefixed pathname', async () => {
    const sendBeacon = vi.fn((_: string, data?: BodyInit | null) => Boolean(data))
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    })

    render(<AnalyticsTracker />)

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledTimes(1))

    const firstCall = sendBeacon.mock.calls[0]
    expect(firstCall).toBeDefined()
    const body = firstCall?.[1]
    expect(body).toBeInstanceOf(Blob)
    if (!(body instanceof Blob)) {
      throw new Error('Expected sendBeacon payload to be a Blob')
    }
    const payload = JSON.parse(await body.text())

    expect(payload.path).toBe('/fr/contact')
    expect(payload.type).toBe('pageview')
  })

  it('tracks subsequent client-side navigations once per visible path', async () => {
    const sendBeacon = vi.fn((_: string, data?: BodyInit | null) => Boolean(data))
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    })

    const { rerender } = render(<AnalyticsTracker />)
    await waitFor(() => expect(sendBeacon).toHaveBeenCalledTimes(1))

    currentPathname = '/faq'
    window.history.pushState({}, '', '/fr/faq')
    rerender(<AnalyticsTracker />)

    await waitFor(() => expect(sendBeacon).toHaveBeenCalledTimes(2))

    const secondCall = sendBeacon.mock.calls[1]
    expect(secondCall).toBeDefined()
    const body = secondCall?.[1]
    expect(body).toBeInstanceOf(Blob)
    if (!(body instanceof Blob)) {
      throw new Error('Expected sendBeacon payload to be a Blob')
    }
    const payload = JSON.parse(await body.text())

    expect(payload.path).toBe('/fr/faq')
    expect(payload.type).toBe('pageview')
  })
})
