import { describe, expect, it } from 'vitest'

import {
  flightBoardQuerySchema,
  revalidateSchema,
  trackEventSchema,
} from '@/lib/validation'

describe('revalidateSchema', () => {
  it('accepts valid path arrays', () => {
    expect(revalidateSchema.safeParse({ paths: ['/contact', '/notices'] }).success).toBe(true)
  })

  it('rejects wrong types, empty arrays, oversized arrays, traversal attempts, duplicate slashes, queries, and fragments', () => {
    expect(revalidateSchema.safeParse({ paths: 'nope' }).success).toBe(false)
    expect(revalidateSchema.safeParse({ paths: [] }).success).toBe(false)
    expect(
      revalidateSchema.safeParse({
        paths: Array.from({ length: 51 }, (_, index) => `/page-${index}`),
      }).success,
    ).toBe(false)
    expect(
      revalidateSchema.safeParse({
        paths: ['../../etc/passwd'],
      }).success,
    ).toBe(false)
    expect(
      revalidateSchema.safeParse({
        paths: ['/../../etc/passwd'],
      }).success,
    ).toBe(false)
    expect(
      revalidateSchema.safeParse({
        paths: ['//dashboard'],
      }).success,
    ).toBe(false)
    expect(
      revalidateSchema.safeParse({
        paths: ['/arrivals?debug=true'],
      }).success,
    ).toBe(false)
    expect(
      revalidateSchema.safeParse({
        paths: ['/%2e%2e/etc/passwd'],
      }).success,
    ).toBe(false)
    expect(
      revalidateSchema.safeParse({
        paths: ['/page#fragment'],
      }).success,
    ).toBe(false)
  })
})

describe('trackEventSchema', () => {
  it('accepts valid pageview payloads', () => {
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '/contact',
        referrer: 'https://example.com',
        locale: 'en',
      }).success,
    ).toBe(true)
  })

  it('rejects invalid types, missing fields, long strings, traversal attempts, duplicate slashes, queries, and fragments', () => {
    expect(trackEventSchema.safeParse({ path: '/contact' }).success).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'click',
        path: '/contact',
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '../../etc/passwd',
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '/../admin',
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '//api/health',
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '/arrivals?debug=true',
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '/%2e%2e/etc/passwd',
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '/page#fragment',
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: `/${'a'.repeat(501)}`,
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '/contact',
        referrer: 'x'.repeat(2001),
      }).success,
    ).toBe(false)
    expect(
      trackEventSchema.safeParse({
        type: 'pageview',
        path: '/contact',
        locale: 'es',
      }).success,
    ).toBe(false)
  })
})

describe('flightBoardQuerySchema', () => {
  it('accepts departures and defaults missing values to arrivals', () => {
    expect(flightBoardQuerySchema.parse({ type: 'departures' })).toEqual({
      type: 'departures',
    })
    expect(flightBoardQuerySchema.parse({})).toEqual({
      type: 'arrivals',
    })
  })

  it('rejects unsupported board types', () => {
    expect(
      flightBoardQuerySchema.safeParse({
        type: 'delayed',
      }).success,
    ).toBe(false)
  })
})
