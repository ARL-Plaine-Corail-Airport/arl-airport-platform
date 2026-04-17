import { describe, expect, it } from 'vitest'

import { normalizeSiteSettings } from '@/lib/site-settings'

describe('normalizeSiteSettings', () => {
  it('leaves already-normalized settings unchanged', () => {
    const settings = {
      airportName: 'Plaine Corail Airport',
      physicalAddress: 'Plaine Corail Airport, Rodrigues',
    }

    expect(normalizeSiteSettings(settings)).toBe(settings)
  })

  it('normalizes legacy airport names in strings and localized records', () => {
    expect(
      normalizeSiteSettings({
        airportName: {
          en: 'Sir Gaetan Duval Airport',
          fr: 'Aeroport Sir Gaetan Duval Airport',
        },
        physicalAddress: 'Sir Gaetan Duval Airport, Rodrigues',
      }),
    ).toEqual({
      airportName: {
        en: 'Plaine Corail Airport',
        fr: 'Aeroport Sir Gaetan Duval Airport',
      },
      physicalAddress: 'Plaine Corail Airport, Rodrigues',
    })
  })
})
