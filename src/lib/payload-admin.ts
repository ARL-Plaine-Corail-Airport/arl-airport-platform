import { headers as getHeaders } from 'next/headers'

import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'

// Dashboard query helper — authenticates the current user via headers
// instead of using overrideAccess: true. This ensures queries respect
// Payload's collection-level access control while still running in the
// context of the logged-in admin user.

export class PayloadAuthError extends Error {
  status = 401

  constructor(message = 'Unauthenticated dashboard access attempt') {
    super(message)
    this.name = 'PayloadAuthError'
  }
}

export function isPayloadAuthError(error: unknown): error is PayloadAuthError {
  return (
    error instanceof PayloadAuthError ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'PayloadAuthError')
  )
}

export async function getAuthenticatedPayload() {
  const headers = await getHeaders()
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers })

  if (!user) {
    throw new PayloadAuthError()
  }

  return { payload, user, headers }
}

// Convenience wrapper for dashboard data fetching with error logging
export async function dashboardQuery<T>(
  label: string,
  fallback: T,
  fn: (payload: Awaited<ReturnType<typeof getPayloadClient>>) => Promise<T>,
): Promise<T> {
  try {
    const payload = await getPayloadClient()
    return await fn(payload)
  } catch (error) {
    if (isPayloadAuthError(error)) {
      throw error
    }

    logger.error(`Dashboard query failed: ${label}`, error, 'dashboard')
    return fallback
  }
}
