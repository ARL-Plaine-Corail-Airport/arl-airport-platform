// =============================================================================
// Supabase Storage — Bucket Strategy
//
// BUCKET: arl-public-media   (PUBLIC)
//   Purpose: All images and publicly accessible media.
//   Access:  Supabase bucket policy → public read.
//   Served:  Directly via Supabase CDN public URL.
//   Contents:
//     /images/hero/         Homepage hero images
//     /images/pages/        Generic page images
//     /images/airlines/     Airline logos
//     /images/staff/        Management and staff photos
//     /images/news/         News and event photos
//     /images/amenities/    Amenity and facility photos
//     /images/map/          Airport map images
//
// BUCKET: arl-protected-docs (PRIVATE)
//   Purpose: Sensitive or regulated PDF documents.
//   Access:  Private. Accessed via server-generated signed URLs (1-hour expiry).
//            Signed URL generation happens in Server Components or API routes only.
//            Never expose the service role key to the browser.
//   Contents:
//     /notices/             Communiqué PDFs
//     /regulations/         Airport regulation documents
//     /fees/                Fee schedule documents
//     /guidance/            Passenger guidance PDFs
//     /general/             Miscellaneous official documents
// =============================================================================

export const BUCKETS = {
  publicMedia:     'arl-public-media',
  protectedDocs:   'arl-protected-docs',
} as const

export type BucketKey = keyof typeof BUCKETS
export type BucketName = (typeof BUCKETS)[BucketKey]

// Folder prefixes within each bucket
export const MEDIA_PREFIXES = {
  heroImages:     'images/hero',
  pageImages:     'images/pages',
  airlineLogos:   'images/airlines',
  staffPhotos:    'images/staff',
  newsImages:     'images/news',
  amenityPhotos:  'images/amenities',
  mapImages:      'images/map',
} as const

export const DOCUMENT_PREFIXES = {
  notices:        'notices',
  regulations:    'regulations',
  fees:           'fees',
  guidance:       'guidance',
  general:        'general',
} as const

// Maximum allowed upload sizes per document type (bytes)
export const MAX_FILE_SIZES = {
  image:    10 * 1024 * 1024,  // 10 MB
  pdf:      25 * 1024 * 1024,  // 25 MB
} as const

// Allowed MIME types per bucket
export const ALLOWED_MEDIA_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] as const
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'] as const

/**
 * Returns the Supabase CDN public URL for an object in the public media bucket.
 * Only use for objects in arl-public-media (public bucket).
 * For protected docs, generate a signed URL server-side instead.
 */
export function getPublicMediaURL(
  supabaseURL: string,
  bucket: string,
  objectPath: string,
): string {
  return `${supabaseURL}/storage/v1/object/public/${bucket}/${objectPath}`
}
