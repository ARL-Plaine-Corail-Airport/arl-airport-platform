import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getServiceWorkerUrl,
  ServiceWorkerRegister,
  shouldDisableServiceWorker,
} from '@/components/pwa/sw-register'

describe('shouldDisableServiceWorker', () => {
  it('disables the service worker on localhost', () => {
    expect(shouldDisableServiceWorker('localhost', 'production')).toBe(true)
  })

  it('allows the service worker for production remote hosts', () => {
    expect(shouldDisableServiceWorker('airport.example', 'production')).toBe(false)
  })

  it('builds a versioned service worker URL', () => {
    expect(getServiceWorkerUrl('build-123')).toBe('/sw.js?v=build-123')
  })
})

describe('ServiceWorkerRegister', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/en')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('unregisters localhost workers and clears airport caches', async () => {
    const unregister = vi.fn().mockResolvedValue(true)
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }])
    const register = vi.fn()
    const deleteCache = vi.fn().mockResolvedValue(true)
    const keys = vi.fn().mockResolvedValue(['arl-static-v7', 'unrelated-cache'])

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistrations,
        register,
      },
    })

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        delete: deleteCache,
        keys,
      },
    })

    render(<ServiceWorkerRegister />)

    await waitFor(() => {
      expect(getRegistrations).toHaveBeenCalledTimes(1)
      expect(unregister).toHaveBeenCalledTimes(1)
      expect(deleteCache).toHaveBeenCalledWith('arl-static-v7')
    })

    expect(deleteCache).not.toHaveBeenCalledWith('unrelated-cache')
    expect(register).not.toHaveBeenCalled()
  })

  it('registers the versioned worker URL in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const originalWindow = window
    vi.stubGlobal(
      'window',
      new Proxy(originalWindow, {
        get(target, property, receiver) {
          if (property === 'location') {
            return {
              ...target.location,
              hostname: 'airport.example',
            }
          }

          return Reflect.get(target, property, receiver)
        },
      }),
    )

    const update = vi.fn().mockResolvedValue(undefined)
    const register = vi.fn().mockResolvedValue({ update })
    const getRegistrations = vi.fn()

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistrations,
        register,
      },
    })

    render(<ServiceWorkerRegister />)

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(getServiceWorkerUrl())
      expect(update).toHaveBeenCalledTimes(1)
    })

    expect(getRegistrations).not.toHaveBeenCalled()
  })
})
