import { afterEach, describe, expect, it, vi } from 'vitest'

const { getHeaders, loggerError, getPayloadClient } = vi.hoisted(() => ({
  getHeaders: vi.fn(),
  loggerError: vi.fn(),
  getPayloadClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: getHeaders,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient,
}))

import {
  PayloadAuthError,
  dashboardQuery,
  getAuthenticatedPayload,
} from '@/lib/payload-admin'

describe('payload admin helpers', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns the authenticated payload context for dashboard requests', async () => {
    const requestHeaders = new Headers([['cookie', 'payload-token=test']])
    const payload = {
      auth: vi.fn().mockResolvedValue({
        user: { email: 'admin@example.com' },
      }),
    }

    getHeaders.mockResolvedValue(requestHeaders)
    getPayloadClient.mockResolvedValue(payload)

    await expect(getAuthenticatedPayload()).resolves.toEqual({
      payload,
      user: { email: 'admin@example.com' },
      headers: requestHeaders,
    })
  })

  it('throws when dashboard access is unauthenticated', async () => {
    getHeaders.mockResolvedValue(new Headers())
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: null }),
    })

    await expect(getAuthenticatedPayload()).rejects.toMatchObject({
      name: 'PayloadAuthError',
      message: 'Unauthenticated dashboard access attempt',
      status: 401,
    })
  })

  it('rethrows payload auth errors through the dashboard query path', async () => {
    const error = new PayloadAuthError()
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { email: 'admin@example.com' } }),
    })

    await expect(
      dashboardQuery('notices', [], async () => {
        throw error
      }),
    ).rejects.toMatchObject({
      name: 'PayloadAuthError',
      status: 401,
    })
  })

  it('returns a fallback and logs errors for dashboard queries', async () => {
    const error = new Error('query failed')
    getPayloadClient.mockRejectedValue(error)

    await expect(
      dashboardQuery('notices', [], async () => ['ignored']),
    ).resolves.toEqual([])
    expect(loggerError).toHaveBeenCalledWith(
      'Dashboard query failed: notices',
      error,
      'dashboard',
    )
  })
})
