import { describe, expect, it } from 'vitest'

import { Flights } from '@/collections/Flights'

function buildAccessArgs(roles?: string[]) {
  return {
    req: {
      user: roles ? { roles } : undefined,
    },
  } as any
}

describe('Flights collection', () => {
  it('restricts public reads to active flights only', () => {
    expect(Flights.access?.read?.(buildAccessArgs())).toEqual({
      status: { equals: 'active' },
    })
  })

  it('allows editors to read hidden flights', () => {
    expect(Flights.access?.read?.(buildAccessArgs(['operations_editor']))).toBe(true)
  })
})
