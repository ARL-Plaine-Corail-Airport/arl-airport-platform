import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('news event attachment signing', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.useRealTimers()
  })

  it('adds signed URLs to news-event document attachments without changing the raw helper output', async () => {
    const payloadFind = vi.fn(async ({ limit }: { limit: number }) => ({
      docs: [
        {
          id: 1,
          slug: 'airport-update',
          attachments: [
            {
              id: 'att-1',
              label: 'Download',
              file: {
                id: 10,
                prefix: 'uploads',
                filename: 'airport-update.pdf',
                url: null,
              },
            },
          ],
        },
      ].slice(0, limit),
    }))
    const getSignedURLs = vi.fn(async () => ({
      'uploads/airport-update.pdf': 'https://signed.example/airport-update.pdf',
    }))

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient: vi.fn(async () => ({
        find: payloadFind,
      })),
    }))
    vi.doMock('@/lib/storage/supabase-client', () => ({
      getSignedURLs,
    }))
    vi.doMock('@/lib/env.server', () => ({
      serverEnv: {
        documentsBucket: 'arl-protected-docs',
      },
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: vi.fn(),
      },
    }))
    vi.doMock('@/lib/build-db', () => ({
      isBuildTimeDbDisabledError: () => false,
    }))

    const {
      getNewsEvents,
      getNewsEventsWithSignedAttachments,
      getNewsEventBySlugWithSignedAttachments,
    } = await import('@/lib/content')

    const rawItems = await getNewsEvents(1, 'en')
    const signedItems = await getNewsEventsWithSignedAttachments(1, 'en')
    const signedItem = await getNewsEventBySlugWithSignedAttachments('airport-update', 'en')

    expect(rawItems[0].attachments?.[0]?.file).toMatchObject({ url: null })
    expect(signedItems[0].attachments?.[0]?.file).toMatchObject({
      url: 'https://signed.example/airport-update.pdf',
    })
    expect(signedItem?.attachments?.[0]?.file).toMatchObject({
      url: 'https://signed.example/airport-update.pdf',
    })
    expect(getSignedURLs).toHaveBeenCalledWith(
      'arl-protected-docs',
      ['uploads/airport-update.pdf'],
    )
  })

  it('filters expired notices from shared notice queries', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-14T12:00:00Z'))

    const payloadFind = vi.fn(async ({ collection }: any) => {
      if (collection !== 'notices') {
        return { totalDocs: 0, docs: [] }
      }

      return {
        totalDocs: 1,
        docs: [
          {
            id: 1,
            title: 'Operational update',
          },
        ],
      }
    })

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient: vi.fn(async () => ({
        find: payloadFind,
      })),
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
      },
    }))
    vi.doMock('@/lib/build-db', () => ({
      isBuildTimeDbDisabledError: () => false,
    }))

    const { getLatestNotices, getNoticeBySlug, getPromotedEmergencyNotice } = await import('@/lib/content')

    await getLatestNotices(6, 'en')
    await getNoticeBySlug('operational-update', 'en')
    await getPromotedEmergencyNotice('en')

    const nowIso = new Date().toISOString()
    const noticeCalls = payloadFind.mock.calls.filter(([args]) => args.collection === 'notices')

    expect(noticeCalls).toHaveLength(3)
    for (const [args] of noticeCalls) {
      expect(args.where).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            expect.objectContaining({
              or: [
                { expiresAt: { exists: false } },
                { expiresAt: { greater_than: nowIso } },
              ],
            }),
          ]),
        }),
      )
    }
  })

  it('logs truncation when fixed-limit content queries drop documents', async () => {
    const loggerWarn = vi.fn()

    const payloadFind = vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'faqs') {
        return {
          totalDocs: 5,
          docs: [{ id: 1 }, { id: 2 }],
        }
      }

      if (collection === 'notices') {
        return {
          totalDocs: 4,
          docs: [
            { id: 1, title: 'First' },
            { id: 2, title: 'Second' },
          ],
        }
      }

      return { totalDocs: 0, docs: [] }
    })

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient: vi.fn(async () => ({
        find: payloadFind,
      })),
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: vi.fn(),
        warn: loggerWarn,
      },
    }))
    vi.doMock('@/lib/build-db', () => ({
      isBuildTimeDbDisabledError: () => false,
    }))

    const { getFAQs, getLatestNotices } = await import('@/lib/content')

    await expect(getFAQs(100, 'en')).resolves.toEqual([{ id: 1 }, { id: 2 }])
    await expect(getLatestNotices(2, 'en')).resolves.toEqual([
      { id: 1, title: 'First' },
      { id: 2, title: 'Second' },
    ])

    expect(loggerWarn).toHaveBeenCalledWith('Truncated 3 items from faqs', 'content')
    expect(loggerWarn).toHaveBeenCalledWith('Truncated 2 items from notices', 'content')
  })

  it('passes the caller-provided FAQ limit through to Payload', async () => {
    const payloadFind = vi.fn(async ({ limit }: { limit: number }) => ({
      totalDocs: limit,
      docs: Array.from({ length: limit }, (_, index) => ({ id: index + 1 })),
    }))

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient: vi.fn(async () => ({
        find: payloadFind,
      })),
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
      },
    }))
    vi.doMock('@/lib/build-db', () => ({
      isBuildTimeDbDisabledError: () => false,
    }))

    const { getFAQs } = await import('@/lib/content')
    const docs = await getFAQs(2, 'en')

    expect(docs).toEqual([{ id: 1 }, { id: 2 }])
    expect(payloadFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'faqs',
        limit: 2,
      }),
    )
  })

  it('returns news events unchanged when signed URL generation fails', async () => {
    const error = new Error('signing unavailable')
    const loggerError = vi.fn()

    vi.doMock('@/lib/payload', () => ({
      getPayloadClient: vi.fn(async () => ({
        find: vi.fn(async () => ({
          docs: [
            {
              id: 1,
              slug: 'airport-update',
              attachments: [
                {
                  id: 'att-1',
                  label: 'Download',
                  file: {
                    id: 10,
                    prefix: 'uploads',
                    filename: 'airport-update.pdf',
                    url: null,
                  },
                },
              ],
            },
          ],
        })),
      })),
    }))
    vi.doMock('@/lib/storage/supabase-client', () => ({
      getSignedURLs: vi.fn(async () => {
        throw error
      }),
    }))
    vi.doMock('@/lib/env.server', () => ({
      serverEnv: {
        documentsBucket: 'arl-protected-docs',
      },
    }))
    vi.doMock('@/lib/logger', () => ({
      logger: {
        error: loggerError,
      },
    }))
    vi.doMock('@/lib/build-db', () => ({
      isBuildTimeDbDisabledError: () => false,
    }))

    const { getNewsEventsWithSignedAttachments } = await import('@/lib/content')
    const signedItems = await getNewsEventsWithSignedAttachments(1, 'en')

    expect(signedItems[0].attachments?.[0]?.file).toMatchObject({ url: null })
    expect(loggerError).toHaveBeenCalledWith(
      'Failed to sign news event attachments',
      error,
      'content',
    )
  })
})
