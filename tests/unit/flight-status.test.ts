import { describe, expect, it } from 'vitest'

import { statusBadgeClass, statusBadgeLabel } from '@/lib/flight-status'

describe('flight status helpers', () => {
  it('maps common remarks to CSS badge classes', () => {
    expect(statusBadgeClass('On Time')).toBe('badge-on-time')
    expect(statusBadgeClass('Delayed 30 mins')).toBe('badge-delayed')
    expect(statusBadgeClass('Cancelled')).toBe('badge-cancelled')
    expect(statusBadgeClass('Landed')).toBe('badge-landed')
    expect(statusBadgeClass('Departed')).toBe('badge-departed')
    expect(statusBadgeClass('Boarding soon')).toBe('badge-scheduled')
  })

  it('maps remarks to translated status labels when possible', () => {
    const t = (key: string) => `translated:${key}`

    expect(statusBadgeLabel('On Time', t)).toBe('translated:flights.on_time')
    expect(statusBadgeLabel('Delayed', t)).toBe('translated:flights.delayed')
    expect(statusBadgeLabel('Cancelled', t)).toBe('translated:flights.cancelled')
    expect(statusBadgeLabel('Landed', t)).toBe('translated:flights.landed')
    expect(statusBadgeLabel('Departed', t)).toBe('translated:flights.departed')
    expect(statusBadgeLabel('', t)).toBe('translated:flights.scheduled')
    expect(statusBadgeLabel('Gate change', t)).toBe('Gate change')
  })
})
