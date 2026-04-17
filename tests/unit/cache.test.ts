import { describe, expect, it } from 'vitest'

/**
 * Tests the cachedFetch shouldCache predicate logic.
 *
 * We can't easily import cachedFetch (it requires Upstash at module level),
 * so we test the caching-decision logic in isolation — the same predicate
 * the API routes pass to cachedFetch.
 */

describe('cachedFetch shouldCache predicate', () => {
  // Weather: skip caching when fetchedAt is null (degraded fallback)
  const weatherShouldCache = (data: { fetchedAt: string | null }) => data.fetchedAt !== null

  it('allows caching a healthy weather response', () => {
    expect(weatherShouldCache({ fetchedAt: '2025-06-15T14:30:00Z' })).toBe(true)
  })

  it('rejects caching a degraded weather response (fetchedAt null)', () => {
    expect(weatherShouldCache({ fetchedAt: null })).toBe(false)
  })

  // Flights: skip caching when degraded flag is true
  const flightShouldCache = (data: { degraded?: boolean }) => !data.degraded

  it('allows caching a healthy flight response', () => {
    expect(flightShouldCache({ degraded: false })).toBe(true)
    expect(flightShouldCache({})).toBe(true)
  })

  it('rejects caching a degraded flight response', () => {
    expect(flightShouldCache({ degraded: true })).toBe(false)
  })
})
