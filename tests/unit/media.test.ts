import { describe, expect, it } from 'vitest'

import { getMediaSource } from '@/lib/media'

describe('getMediaSource', () => {
  it('returns null for missing media', () => {
    expect(getMediaSource(null)).toBeNull()
  })

  it('prefers the requested size variant when it exists', () => {
    expect(
      getMediaSource(
        {
          alt: 'Aircraft',
          caption: 'Runway approach',
          url: '/hero.jpg',
          width: 1400,
          height: 900,
          sizes: {
            card: {
              url: '/card.jpg',
              width: 640,
              height: 480,
            },
          },
        },
        'card',
      ),
    ).toEqual({
      src: '/card.jpg',
      alt: 'Aircraft',
      caption: 'Runway approach',
      width: 640,
      height: 480,
    })
  })

  it('falls back to the base asset and default dimensions', () => {
    expect(
      getMediaSource(
        {
          filename: 'fallback.jpg',
          url: '/fallback.jpg',
        },
        'hero',
        'Fallback alt',
      ),
    ).toEqual({
      src: '/fallback.jpg',
      alt: 'Fallback alt',
      caption: null,
      width: 1600,
      height: 900,
    })
  })
})
