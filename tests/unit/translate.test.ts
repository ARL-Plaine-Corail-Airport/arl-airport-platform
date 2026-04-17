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
      if (i > 0 && i % 19 === 0) {
        vi.setSystemTime(new Date(Date.now() + 61_000))
      }
      await translate({ text: `entry-${i}`, from: 'en', to: 'fr' })
    }
    vi.setSystemTime(new Date(Date.now() + 61_000))

    await translate({ text: 'oldest', from: 'en', to: 'fr' })
    expect(fetchMock).toHaveBeenCalledTimes(1002)
  })

  it('short-circuits translations that exceed the maximum length', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { translate } = await import('@/lib/translate')
    const longText = 'x'.repeat(5001)
    const result = await translate({
      text: longText,
      from: 'en',
      to: 'fr',
    })

    expect(result).toBe(longText)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      '[WARN] [translate] Translation skipped: input exceeds 5000 characters',
    )
  })

  it('rate limits uncached translations within the current window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-09T00:00:00.000Z'))

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const text = url.searchParams.get('q') ?? ''

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

    for (let i = 0; i < 20; i++) {
      await expect(translate({ text: `entry-${i}`, from: 'en', to: 'fr' })).resolves.toBe(
        `entry-${i}-fr`,
      )
    }

    await expect(translate({ text: 'entry-21', from: 'en', to: 'fr' })).resolves.toBe(
      'entry-21',
    )
    expect(fetchMock).toHaveBeenCalledTimes(20)
  })

  it('translates batches with a maximum concurrency of five', async () => {
    const started: string[] = []
    const resolvers = new Map<string, () => void>()
    let resolveSixthStarted: (() => void) | undefined
    const sixthStarted = new Promise<void>((resolve) => {
      resolveSixthStarted = resolve
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = new URL(typeof input === 'string' ? input : input.toString())
        const text = url.searchParams.get('q') ?? ''

        started.push(text)
        if (text === 'sixth') {
          resolveSixthStarted?.()
        }

        return await new Promise((resolve) => {
          const response = {
            ok: true,
            json: async () => ({
              responseStatus: 200,
              responseData: { translatedText: `${text}-fr`, match: 1 },
            }),
          }

          resolvers.set(text, () => resolve(response))
        })
      }),
    )

    const { translateBatch } = await import('@/lib/translate')
    const batchPromise = translateBatch(
      ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'],
      'en',
      'fr',
    )

    await Promise.resolve()

    try {
      expect(started.slice(0, 5)).toEqual(['first', 'second', 'third', 'fourth', 'fifth'])
      expect(started).not.toContain('sixth')
    } finally {
      for (const text of ['first', 'second', 'third', 'fourth', 'fifth']) {
        resolvers.get(text)?.()
      }
    }

    await sixthStarted
    expect(started).toEqual(['first', 'second', 'third', 'fourth', 'fifth', 'sixth'])

    resolvers.get('sixth')?.()

    await expect(batchPromise).resolves.toEqual([
      'first-fr',
      'second-fr',
      'third-fr',
      'fourth-fr',
      'fifth-fr',
      'sixth-fr',
    ])
  })
})
