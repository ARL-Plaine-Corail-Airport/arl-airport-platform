import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatDate, formatDateTime, getMauritiusDayRange } from '@/lib/date'

const EMPTY_VALUE = '\u2014'

describe('formatDateTime', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns em dash for null/undefined', () => {
    expect(formatDateTime(null)).toBe(EMPTY_VALUE)
    expect(formatDateTime(undefined)).toBe(EMPTY_VALUE)
    expect(formatDateTime('')).toBe(EMPTY_VALUE)
  })

  it('formats a valid ISO date string', () => {
    const result = formatDateTime('2025-06-15T14:30:00Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe(EMPTY_VALUE)
  })

  it('returns em dash for invalid date strings', () => {
    expect(formatDateTime('not-a-date')).toBe(EMPTY_VALUE)
    expect(formatDate('not-a-date')).toBe(EMPTY_VALUE)
  })

  it('pins the site timezone for deterministic SSR and hydration output', () => {
    const format = vi.fn(() => '15 Jun 2025, 18:30')

    function MockDateTimeFormat() {
      return { format }
    }

    const formatterSpy = vi
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation(MockDateTimeFormat as unknown as typeof Intl.DateTimeFormat)

    const result = formatDateTime('2025-06-15T14:30:00Z', 'fr')

    expect(result).toBe('15 Jun 2025, 18:30')
    expect(formatterSpy).toHaveBeenCalledWith(
      'fr-MU',
      expect.objectContaining({
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Indian/Mauritius',
      }),
    )
    expect(format).toHaveBeenCalledTimes(1)
  })
})

describe('getMauritiusDayRange', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns valid ISO strings for startOfDay and endOfDay', () => {
    const { startOfDay, endOfDay } = getMauritiusDayRange()

    expect(startOfDay).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    expect(endOfDay).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  })

  it('startOfDay is before endOfDay', () => {
    const { startOfDay, endOfDay } = getMauritiusDayRange()
    expect(new Date(startOfDay).getTime()).toBeLessThan(new Date(endOfDay).getTime())
  })

  it('the range spans approximately 24 hours', () => {
    const { startOfDay, endOfDay } = getMauritiusDayRange()
    const diff = new Date(endOfDay).getTime() - new Date(startOfDay).getTime()
    const almostOneDay = 24 * 60 * 60 * 1000 - 1 // 23:59:59.999
    expect(diff).toBe(almostOneDay)
  })

  it('startOfDay corresponds to midnight Mauritius time (UTC-4h = 20:00 UTC previous day)', () => {
    const { startOfDay } = getMauritiusDayRange()
    const d = new Date(startOfDay)
    // Mauritius is UTC+4, so midnight MU = 20:00 UTC of previous calendar day
    expect(d.getUTCHours()).toBe(20)
    expect(d.getUTCMinutes()).toBe(0)
    expect(d.getUTCSeconds()).toBe(0)
  })

  it('falls back when formatToParts omits expected date parts', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      function MockDateTimeFormat() {
        return {
          formatToParts: () => [{ type: 'year', value: '2025' }],
          format: () => '2025-06-15',
        }
      } as unknown as typeof Intl.DateTimeFormat,
    )

    const { startOfDay, endOfDay } = getMauritiusDayRange()

    expect(startOfDay).toBe(new Date('2025-06-15T00:00:00+04:00').toISOString())
    expect(endOfDay).toBe(new Date('2025-06-15T23:59:59.999+04:00').toISOString())
  })
})

describe('formatDate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('pins the site timezone for date-only formatting too', () => {
    const dateSpy = vi
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockReturnValue('15 Jun 2025')

    expect(formatDate('2025-06-15T23:30:00Z')).toBe('15 Jun 2025')
    expect(dateSpy).toHaveBeenCalledWith(
      'en-GB',
      expect.objectContaining({
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Indian/Mauritius',
      }),
    )
  })
})
