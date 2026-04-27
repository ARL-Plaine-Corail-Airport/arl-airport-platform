import 'server-only'

// =============================================================================
// Supabase Server Client - Storage Operations
//
// SERVER-ONLY. Do not import in client components or browser code.
// Uses the service role key to bypass RLS when generating signed URLs
// and performing admin storage operations.
// =============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { logger } from '@/lib/logger'

// Module-level singleton to avoid creating a new client on every call
let _client: SupabaseClient | null = null

function getRuntimeEnv(name: string): string | undefined {
  return process.env[name]
}

/**
 * Returns a singleton Supabase client configured with the service role key.
 * This client has admin-level access - use only in server-side code.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (_client) return _client

  const url = getRuntimeEnv('SUPABASE_URL') || getRuntimeEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !key) {
    throw new Error(
      '[supabase-client] SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY must be set. ' +
      'These are server-only variables.',
    )
  }

  _client = createClient(url, key, {
    auth: {
      // Service role clients do not need a persisted session
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _client
}

// -----------------------------------------------------------------------------
// Signed URL Generation
// -----------------------------------------------------------------------------

const SIGNED_URL_EXPIRY_SECONDS = 3600 // 1 hour
const SIGNED_URL_TIMEOUT_MS = 10_000

export class SignedUrlTimeoutError extends Error {
  constructor(bucket: string, path: string) {
    super(`Signed URL generation timed out for ${bucket}/${path}`)
    this.name = 'SignedUrlTimeoutError'
  }
}

function createSignedUrlTimeout(bucket: string, path: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new SignedUrlTimeoutError(bucket, path))
    }, SIGNED_URL_TIMEOUT_MS)
  })

  return {
    promise,
    clear: () => {
      if (timeoutId) clearTimeout(timeoutId)
    },
  }
}

/**
 * Generates a time-limited signed URL for a private document.
 * Use for notice PDFs, regulations, and fee schedules in arl-protected-docs.
 *
 * @param bucket  Bucket name (use BUCKETS.protectedDocs)
 * @param path    Object path within the bucket (e.g. "notices/2024-communique-01.pdf")
 * @param expiresIn Expiry in seconds (default: 3600)
 * @throws SignedUrlTimeoutError if Supabase does not respond within 10s.
 * @throws Error on any other Supabase failure.
 */
export async function getSignedURL(
  bucket: string,
  path: string,
  expiresIn: number = SIGNED_URL_EXPIRY_SECONDS,
): Promise<string> {
  const supabase = getSupabaseAdminClient()
  const signedUrlPromise = supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  void signedUrlPromise.catch(() => undefined)
  const timeout = createSignedUrlTimeout(bucket, path)

  try {
    const { data, error } = await Promise.race([
      signedUrlPromise,
      timeout.promise,
    ])

    if (error || !data?.signedUrl) {
      throw new Error(
        `[supabase-client] Failed to generate signed URL for ${bucket}/${path}: ${error?.message}`,
      )
    }

    return data.signedUrl
  } finally {
    timeout.clear()
  }
}

/**
 * Generates signed URLs for multiple objects in a single batch call.
 * More efficient than calling getSignedURL in a loop.
 */
export async function getSignedURLs(
  bucket: string,
  paths: string[],
  expiresIn: number = SIGNED_URL_EXPIRY_SECONDS,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}

  const supabase = getSupabaseAdminClient()
  const timeout = createSignedUrlTimeout(bucket, `${paths.length} paths`)

  const signedUrlsPromise = supabase.storage
    .from(bucket)
    .createSignedUrls(paths, expiresIn)
  void signedUrlsPromise.catch(() => undefined)

  const { data, error } = await Promise.race([
    signedUrlsPromise,
    timeout.promise,
  ]).finally(() => {
    timeout.clear()
  })

  if (error || !data) {
    throw new Error(
      `[supabase-client] Failed to batch-generate signed URLs: ${error?.message}`,
    )
  }

  return Object.fromEntries(
    data
      .filter(
        (item): item is typeof item & { signedUrl: string } =>
          item.signedUrl != null,
      )
      .map((item) => [item.path, item.signedUrl]),
  )
}

// -----------------------------------------------------------------------------
// File Deletion
// -----------------------------------------------------------------------------

/**
 * Deletes a file from a Supabase Storage bucket.
 * Called from Payload afterDelete hooks to avoid orphaned storage objects.
 */
export async function deleteStorageObject(
  bucket: string,
  path: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    // Log but do not throw - a failed delete should not block Payload's response.
    logger.error(`Failed to delete ${bucket}/${path}`, error, 'supabase-client')
  }
}
