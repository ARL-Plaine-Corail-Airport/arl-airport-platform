import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import { describe, expect, it, vi } from 'vitest'

type ServiceWorkerFetchEvent = {
  request: Request
  respondWith: (response: Promise<Response> | Response) => void
}

type ServiceWorkerInstallEvent = {
  waitUntil: (promise: Promise<unknown>) => void
}

function loadServiceWorker(fetchImpl: typeof fetch) {
  const listeners: Record<string, ((event: unknown) => void) | undefined> = {}
  const cacheAdd = vi.fn().mockResolvedValue(undefined)
  const cachePut = vi.fn().mockResolvedValue(undefined)
  const cacheOpen = vi.fn().mockResolvedValue({ add: cacheAdd, put: cachePut })
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
    cacheAdd,
    cacheOpen,
    cachePut,
    listeners,
    warn,
  }
}

async function dispatchInstall(
  handler: ((event: unknown) => void) | undefined,
): Promise<void> {
  if (!handler) {
    throw new Error('Service worker install handler was not registered')
  }

  let installPromise: Promise<unknown> | undefined
  handler({
    waitUntil: (promise: Promise<unknown>) => {
      installPromise = Promise.resolve(promise)
    },
  } satisfies ServiceWorkerInstallEvent)

  if (!installPromise) {
    throw new Error('Service worker install handler did not call waitUntil')
  }

  await installPromise
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

describe('service worker install precache policy', () => {
  it('keeps installing when one localized route fails to precache', async () => {
    const fetchMock = vi.fn()
    const { cacheAdd, cacheOpen, listeners, warn } = loadServiceWorker(fetchMock)
    cacheAdd.mockImplementation((url: string) => {
      if (url === '/fr/contact') {
        return Promise.reject(new Error('route unavailable'))
      }

      return Promise.resolve()
    })

    await expect(dispatchInstall(listeners.install)).resolves.toBeUndefined()

    expect(cacheOpen).toHaveBeenCalledWith('arl-static-test-build')
    expect(cacheAdd).toHaveBeenCalledWith('/en/offline')
    expect(cacheAdd).toHaveBeenCalledWith('/fr/contact')
    expect(cacheAdd).toHaveBeenCalledWith('/mfe/vip-lounge')
    expect(warn).toHaveBeenCalledWith(
      '[sw] Failed to precache /fr/contact',
      expect.any(Error),
    )
  })
})

describe('service worker live API cache policy', () => {
  it('skips caching successful live API responses marked no-store', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('degraded', {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store ',
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

  it('clones cacheable responses before asynchronous cache open settles', async () => {
    const response = new Response('healthy', {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    })
    const cloneSpy = vi.spyOn(response, 'clone')
    const fetchMock = vi.fn().mockResolvedValue(response)
    const cache = {
      add: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    }
    let resolveCacheOpen: ((value: typeof cache) => void) | undefined
    const cacheOpenPromise = new Promise<typeof cache>((resolve) => {
      resolveCacheOpen = resolve
    })

    const { cacheOpen, listeners } = loadServiceWorker(fetchMock)
    cacheOpen.mockReturnValueOnce(cacheOpenPromise)

    const returnedResponse = await dispatchFetch(
      listeners.fetch,
      new Request('https://airport.example/api/weather'),
    )

    expect(returnedResponse.status).toBe(200)
    expect(cloneSpy).toHaveBeenCalledTimes(1)
    expect(cache.put).not.toHaveBeenCalled()

    resolveCacheOpen?.(cache)
    await vi.waitFor(() => {
      expect(cache.put).toHaveBeenCalledWith(expect.any(Request), expect.any(Response))
    })
  })
})
