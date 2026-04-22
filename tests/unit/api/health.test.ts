import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getPayloadClient, loggerError } = vi.hoisted(() => ({
  getPayloadClient: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

async function loadHealthRoute() {
  vi.resetModules()
  return await import('@/app/api/health/route')
}

const statusSecret = 'test-status-secret-123'

function withStatusAuth() {
  return {
    authorization: `Bearer ${statusSecret}`,
  }
}

describe('health route', () => {
  beforeEach(() => {
    vi.stubEnv('STATUS_SECRET', statusSecret)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns a shallow health response without initializing Payload', async () => {
    getPayloadClient.mockRejectedValue(new Error('payload init down'))
    const { GET } = await loadHealthRoute()

    const response = await GET(new NextRequest('http://localhost/api/health'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(typeof body.timestamp).toBe('string')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(getPayloadClient).not.toHaveBeenCalled()
  })

  it('requires Bearer auth for deep health checks', async () => {
    const findGlobal = vi.fn().mockResolvedValue({})
    getPayloadClient.mockResolvedValue({ findGlobal })
    const { GET } = await loadHealthRoute()

    const response = await GET(new NextRequest('http://localhost/api/health?deep=true'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, error: 'Unauthorized' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(getPayloadClient).not.toHaveBeenCalled()
    expect(findGlobal).not.toHaveBeenCalled()
  })

  it('returns deep health success when Payload can reach the database', async () => {
    const findGlobal = vi.fn().mockResolvedValue({})
    getPayloadClient.mockResolvedValue({ findGlobal })
    const { GET } = await loadHealthRoute()

    const response = await GET(new NextRequest('http://localhost/api/health?deep=true', {
      headers: withStatusAuth(),
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.services).toEqual({
      app: 'ok',
      payload: 'ok',
      database: 'ok',
    })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(findGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 0,
      overrideAccess: true,
    })
  })

  it('returns 503 for deep health checks when Payload fails', async () => {
    const error = new Error('db down')
    const findGlobal = vi.fn().mockRejectedValue(error)
    getPayloadClient.mockResolvedValue({ findGlobal })
    const { GET } = await loadHealthRoute()

    const response = await GET(new NextRequest('http://localhost/api/health?deep=true', {
      headers: withStatusAuth(),
    }))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.ok).toBe(false)
    expect(body.services).toEqual({
      app: 'degraded',
      payload: 'error',
      database: 'error',
    })
    expect(body.error).toBe('Healthcheck failed')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(loggerError).toHaveBeenCalledWith('Healthcheck failed', error, 'health')
  })
})
