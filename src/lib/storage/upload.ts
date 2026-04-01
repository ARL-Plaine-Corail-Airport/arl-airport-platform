// =============================================================================
// Upload Utility — Supabase Storage
//
// SERVER-ONLY. Direct uploads via the Supabase JS client for use cases
// outside of Payload's managed upload flow (e.g. programmatic seeding,
// or future integration with external document sources).
//
// For Payload-managed uploads (admin UI), the @payloadcms/storage-s3 plugin
// handles upload routing automatically — you do not need this file for that.
// =============================================================================

import { getSupabaseAdminClient } from './supabase-client'
import {
  BUCKETS,
  MAX_FILE_SIZES,
  ALLOWED_MEDIA_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from './buckets'

export type UploadDocumentType = 'image' | 'pdf'

export interface UploadOptions {
  /** Target bucket (use BUCKETS constants) */
  bucket: string
  /** Object path within the bucket, e.g. "notices/2024-01-communique.pdf" */
  path: string
  /** The file buffer */
  buffer: Buffer
  /** MIME type of the file */
  contentType: string
  /** Set cache-control header for CDN edge caching */
  cacheControl?: string
  /** Whether to overwrite an existing file at the same path */
  upsert?: boolean
}

export interface UploadResult {
  path: string
  fullPath: string
  publicURL: string | null
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateUpload(
  contentType: string,
  sizeBytes: number,
  docType: UploadDocumentType,
): { valid: true } | { valid: false; reason: string } {
  const maxSize = MAX_FILE_SIZES[docType]

  if (sizeBytes > maxSize) {
    return {
      valid: false,
      reason: `File size ${sizeBytes} exceeds maximum ${maxSize} bytes for ${docType}`,
    }
  }

  const allowed =
    docType === 'image'
      ? (ALLOWED_MEDIA_TYPES as readonly string[])
      : (ALLOWED_DOCUMENT_TYPES as readonly string[])

  if (!allowed.includes(contentType)) {
    return {
      valid: false,
      reason: `MIME type "${contentType}" is not permitted for ${docType}. Allowed: ${allowed.join(', ')}`,
    }
  }

  return { valid: true }
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Uploads a file buffer to Supabase Storage.
 *
 * For public media bucket (arl-public-media), returns the public CDN URL.
 * For protected docs bucket (arl-protected-docs), returns null for publicURL
 * — use getSignedURL() from supabase-client.ts instead.
 */
export async function uploadToStorage(opts: UploadOptions): Promise<UploadResult> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.storage.from(opts.bucket).upload(
    opts.path,
    opts.buffer,
    {
      contentType:  opts.contentType,
      cacheControl: opts.cacheControl ?? '3600',
      upsert:       opts.upsert      ?? false,
    },
  )

  if (error) {
    throw new Error(
      `[upload] Failed to upload to ${opts.bucket}/${opts.path}: ${error.message}`,
    )
  }

  const isPublicBucket = opts.bucket === BUCKETS.publicMedia

  let publicURL: string | null = null
  if (isPublicBucket) {
    const { data: urlData } = supabase.storage
      .from(opts.bucket)
      .getPublicUrl(data.path)
    publicURL = urlData.publicUrl
  }

  return {
    path:      data.path,
    fullPath:  data.fullPath,
    publicURL,
  }
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

/**
 * Upload a public image (goes to arl-public-media bucket).
 * Returns the CDN public URL immediately.
 */
export async function uploadPublicImage(
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<UploadResult> {
  const validation = validateUpload(contentType, buffer.byteLength, 'image')
  if (!validation.valid) throw new Error(`[upload] ${validation.reason}`)

  return uploadToStorage({
    bucket:       BUCKETS.publicMedia,
    path,
    buffer,
    contentType,
    cacheControl: '86400', // 24h CDN cache for public images
    upsert:       false,
  })
}

/**
 * Upload a protected PDF document (goes to arl-protected-docs bucket).
 * Access requires a server-generated signed URL — publicURL will be null.
 */
export async function uploadProtectedDocument(
  buffer: Buffer,
  path: string,
): Promise<UploadResult> {
  const validation = validateUpload('application/pdf', buffer.byteLength, 'pdf')
  if (!validation.valid) throw new Error(`[upload] ${validation.reason}`)

  return uploadToStorage({
    bucket:       BUCKETS.protectedDocs,
    path,
    buffer,
    contentType:  'application/pdf',
    cacheControl: '3600',
    upsert:       false,
  })
}
