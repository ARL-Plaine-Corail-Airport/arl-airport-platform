import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import { describe, expect, it, vi } from 'vitest'

type ServiceWorkerFetchEvent = {
  request: Request
  respondWith: (response: Promise<Response> | Response) => void
}

function loadServiceWorker(fetchImpl: typeof fetch) {
  const listeners: Record<string, ((event: unknown) => void) | undefined> = {}
  const cachePut = vi.fn().mockResolvedValue(undefined)
  const cacheOpen = vi.fn().mockResolvedValue({ put: cachePut })
  const cacheMatch = vi.fn().mockResolvedValue(undefined)
  const cacheKeys = vi.fn().mockResolvedValue([])
  const cacheDelete = vi.fn().mockResolvedValue(true)
  const warn = vi.fn()

  const script = readFileSync(
    resolve(process.cwd(), 'public/sw.js'),
    'utf8',
  )

  runInNewContext(script, {
    URL,
    Request,
    Response,
    caches: {
      delete: cacheDelete,
      keys: cacheKeys,
      match: cacheMatch,
      open: cacheOpen,
    },
    console: { warn },
    fetch: fetchImpl,
    self: {
      addEventListener: (type: string, handler: (event: unknown) => void) => {
        listeners[type] = handler
      },
      clients: { claim: vi.fn() },
      location: new URL('https://airport.example/sw.js?v=test-build'),
      registration: { unregister: vi.fn() },
      skipWaiting: vi.fn(),
    },
  })

  return {
    cacheOpen,
    cachePut,
    listeners,
  }
}

async function dispatchFetch(
  handler: ((event: unknown) => void) | undefined,
  request: Request,
): Promise<Response> {
  if (!handler) {
    throw new Error('Service worker fetch handler was not registered')
  }

  let responsePromise: Promise<Response> | undefined
  handler({
    request,
    respondWith: (response: Promise<Response> | Response) => {
      responsePromise = Promise.resolve(response)
    },
  } satisfies ServiceWorkerFetchEvent)

  if (!responsePromise) {
    throw new Error('Service worker fetch handler did not call respondWith')
  }

  const response = await responsePromise
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  return response
}

describe('service worker live API cache policy', () => {
  it('skips caching successful live API responses marked no-store', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('degraded', {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    }))

    const { cacheOpen, cachePut, listeners } = loadServiceWorker(fetchMock)

    const response = await dispatchFetch(
      listeners.fetch,
      new Request('https://airport.example/api/weather'),
    )

    expect(response.status).toBe(200)
    expect(cacheOpen).not.toHaveBeenCalled()
    expect(cachePut).not.toHaveBeenCalled()
  })

  it('still caches healthy live API responses that are allowed to persist', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('healthy', {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    }))

    const { cacheOpen, cachePut, listeners } = loadServiceWorker(fetchMock)

    const response = await dispatchFetch(
      listeners.fetch,
      new Request('https://airport.example/api/weather'),
    )

    expect(response.status).toBe(200)
    expect(cacheOpen).toHaveBeenCalledTimes(1)
    expect(cachePut).toHaveBeenCalledTimes(1)
  })
})
