import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useLiveApiData } from '@/hooks/use-live-api-data'

function Harness() {
  const { data } = useLiveApiData<{ value: string }>({
    initialData: { value: 'initial' },
    refreshIntervalMs: 60_000,
    url: '/api/live',
  })

  return <span data-testid="value">{data.value}</span>
}

describe('useLiveApiData', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('subscribes before syncing the current visibility state', async () => {
    let visibilityState = 'hidden'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ value: 'fresh' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<Harness />)

    expect(screen.getByTestId('value')).toHaveTextContent('initial')
    expect(fetchMock).not.toHaveBeenCalled()

    visibilityState = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('fresh')
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
