import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath,
}))

vi.mock('@/lib/env.server', () => ({
  serverEnv: {
    revalidateSecret: 'supersecret-12345',
  },
}))

import { POST } from '@/app/api/revalidate/route'

describe('revalidate route', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the secret header is missing', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact'] }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, message: 'Unauthorized' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns 401 when the secret is invalid', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'wrongsecret',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ ok: false, message: 'Unauthorized' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates each provided path when the secret is valid', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/contact', '/notices'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      revalidated: ['/contact', '/notices'],
    })
    expect(revalidatePath).toHaveBeenCalledTimes(2)
    expect(revalidatePath).toHaveBeenNthCalledWith(1, '/contact')
    expect(revalidatePath).toHaveBeenNthCalledWith(2, '/notices')
  })

  it('returns 400 when the payload is empty', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid request' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns 400 and skips revalidation for malformed paths', async () => {
    const request = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ paths: ['/../../etc/passwd', '//dashboard'] }),
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': 'supersecret-12345',
      },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid request' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
