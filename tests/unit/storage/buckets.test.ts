import { describe, expect, it } from 'vitest'

import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_MEDIA_TYPES,
  BUCKETS,
  DOCUMENT_PREFIXES,
  MAX_FILE_SIZES,
  MEDIA_PREFIXES,
  getPublicMediaURL,
} from '@/lib/storage/buckets'

describe('storage bucket constants', () => {
  it('defines the public media and protected document buckets', () => {
    expect(BUCKETS).toEqual({
      publicMedia: 'arl-public-media',
      protectedDocs: 'arl-protected-docs',
    })
  })

  it('defines media and document prefixes used by uploads', () => {
    expect(MEDIA_PREFIXES).toMatchObject({
      heroImages: 'images/hero',
      pageImages: 'images/pages',
      airlineLogos: 'images/airlines',
      staffPhotos: 'images/staff',
      newsImages: 'images/news',
      amenityPhotos: 'images/amenities',
      mapImages: 'images/map',
    })

    expect(DOCUMENT_PREFIXES).toMatchObject({
      notices: 'notices',
      regulations: 'regulations',
      fees: 'fees',
      guidance: 'guidance',
      general: 'general',
    })
  })

  it('defines upload size and MIME type policies', () => {
    expect(MAX_FILE_SIZES.image).toBe(10 * 1024 * 1024)
    expect(MAX_FILE_SIZES.pdf).toBe(25 * 1024 * 1024)
    expect(ALLOWED_MEDIA_TYPES).toContain('image/webp')
    expect(ALLOWED_DOCUMENT_TYPES).toEqual(['application/pdf'])
  })

  it('builds public media URLs without changing the object path', () => {
    expect(
      getPublicMediaURL(
        'https://project.supabase.co',
        BUCKETS.publicMedia,
        'images/hero/terminal.webp',
      ),
    ).toBe(
      'https://project.supabase.co/storage/v1/object/public/arl-public-media/images/hero/terminal.webp',
    )
  })
})
