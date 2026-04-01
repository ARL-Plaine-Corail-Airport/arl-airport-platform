import { describe, expect, it } from 'vitest'

import { formatDateTime } from '@/lib/date'

describe('formatDateTime', () => {
  it('returns em dash for null/undefined', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
    expect(formatDateTime('')).toBe('—')
  })

  it('formats a valid ISO date string', () => {
    const result = formatDateTime('2025-06-15T14:30:00Z')
    // Should contain the date parts (exact format depends on locale)
    expect(result).toBeTruthy()
    expect(result).not.toBe('—')
  })
})
