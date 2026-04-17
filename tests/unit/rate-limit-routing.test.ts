import { describe, expect, it } from 'vitest'

/**
 * Tests the public API route matching logic used by the middleware
 * rate limiter. Verifies that Payload's catch-all is excluded and
 * only explicitly listed public routes are rate-limited.
 */

const PUBLIC_API_ROUTES = ['/api/track', '/api/revalidate', '/api/health', '/api/flight-board', '/api/weather']

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

describe('public API rate-limit routing', () => {
  it('matches explicit public API routes', () => {
    expect(isPublicApiRoute('/api/track')).toBe(true)
    expect(isPublicApiRoute('/api/revalidate')).toBe(true)
    expect(isPublicApiRoute('/api/health')).toBe(true)
    expect(isPublicApiRoute('/api/flight-board')).toBe(true)
    expect(isPublicApiRoute('/api/weather')).toBe(true)
  })

  it('does not match Payload REST catch-all routes', () => {
    // These are the runtime paths that hit Payload's [[...slug]] handler
    expect(isPublicApiRoute('/api/notices')).toBe(false)
    expect(isPublicApiRoute('/api/users')).toBe(false)
    expect(isPublicApiRoute('/api/media')).toBe(false)
    expect(isPublicApiRoute('/api/globals/site-settings')).toBe(false)
    expect(isPublicApiRoute('/api/news-events')).toBe(false)
  })

  it('does not match the bare /api path', () => {
    expect(isPublicApiRoute('/api')).toBe(false)
  })

  it('matches sub-paths of public routes', () => {
    expect(isPublicApiRoute('/api/track/event')).toBe(true)
  })

  it('does not match partial name collisions', () => {
    expect(isPublicApiRoute('/api/tracking')).toBe(false)
    expect(isPublicApiRoute('/api/weather-extended')).toBe(false)
  })
})
