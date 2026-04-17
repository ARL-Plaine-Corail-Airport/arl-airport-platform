import { afterEach, describe, expect, it, vi } from 'vitest'

describe('translate', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('warns and falls back to the source text when the request fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const { translate } = await import('@/lib/translate')
    const result = await translate({
      text: 'Hello from unique translation test input',
      from: 'en',
      to: 'fr',
    })

    expect(result).toBe('Hello from unique translation test input')
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
      '[WARN] [translate] Translation failed: network down',
    )
  })

  it('expires cached translations after the TTL', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-09T00:00:00.000Z'))

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: { translatedText: 'Bonjour', match: 1 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: { translatedText: 'Salut', match: 1 },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const { translate } = await import('@/lib/translate')

    await expect(translate({ text: 'Hello', from: 'en', to: 'fr' })).resolves.toBe('Bonjour')
    await expect(translate({ text: 'Hello', from: 'en', to: 'fr' })).resolves.toBe('Bonjour')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.setSystemTime(new Date('2026-04-10T00:00:01.000Z'))

    await expect(translate({ text: 'Hello', from: 'en', to: 'fr' })).resolves.toBe('Salut')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('evicts the oldest cached translation when the cache exceeds its max size', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-09T00:00:00.000Z'))

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const text = url.searchParams.get('q')

      return {
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: { translatedText: `${text}-fr`, match: 1 },
        }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const { translate } = await import('@/lib/translate')

    await translate({ text: 'oldest', from: 'en', to: 'fr' })
    for (let i = 0; i < 1000; i++) {
      await translate({ text: `entry-${i}`, from: 'en', to: 'fr' })
    }

    await translate({ text: 'oldest', from: 'en', to: 'fr' })
    expect(fetchMock).toHaveBeenCalledTimes(1002)
  })

  it('translates batches in parallel', async () => {
    const started: string[] = []
    let resolveFirst: (() => void) | undefined
    let resolveSecond: (() => void) | undefined

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = new URL(typeof input === 'string' ? input : input.toString())
        const text = url.searchParams.get('q') ?? ''

        started.push(text)

        return await new Promise((resolve) => {
          const response = {
            ok: true,
            json: async () => ({
              responseStatus: 200,
              responseData: { translatedText: `${text}-fr`, match: 1 },
            }),
          }

          if (text === 'first') {
            resolveFirst = () => resolve(response)
          } else {
            resolveSecond = () => resolve(response)
          }
        })
      }),
    )

    const { translateBatch } = await import('@/lib/translate')
    const batchPromise = translateBatch(['first', 'second'], 'en', 'fr')

    await Promise.resolve()

    try {
      expect(started).toEqual(['first', 'second'])
    } finally {
      resolveFirst?.()
      resolveSecond?.()
    }

    await expect(batchPromise).resolves.toEqual(['first-fr', 'second-fr'])
  })
})
