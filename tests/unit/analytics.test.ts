import { beforeEach, describe, expect, it, vi } from 'vitest'

const findMock = vi.fn()
const { loggerError, loggerWarn } = vi.hoisted(() => ({
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
    warn: loggerWarn,
  },
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: vi.fn(async () => ({
    find: findMock,
  })),
}))

import { getAnalytics } from '@/lib/analytics'

describe('getAnalytics', () => {
  beforeEach(() => {
    findMock.mockReset()
    loggerError.mockReset()
    loggerWarn.mockReset()
  })

  it('averages daily unique visitors across the days that have data', async () => {
    findMock.mockResolvedValue({
      docs: [
        {
          createdAt: '2026-03-01T08:00:00.000Z',
          visitorHash: 'hash-a',
          path: '/fr/contact',
        },
        {
          createdAt: '2026-03-01T09:00:00.000Z',
          visitorHash: 'hash-b',
          path: '/fr/contact',
        },
        {
          createdAt: '2026-03-02T10:00:00.000Z',
          visitorHash: 'hash-c',
          path: '/fr/contact',
        },
      ],
      hasNextPage: false,
    })

    const analytics = await getAnalytics('30d')

    expect(analytics.dailyUniqueVisitors).toBe(1.5)
  })

  it('keeps locale-prefixed page paths distinct in the dashboard aggregates', async () => {
    findMock.mockResolvedValue({
      docs: [
        {
          createdAt: '2026-03-01T08:00:00.000Z',
          visitorHash: 'hash-a',
          path: '/fr/contact',
        },
        {
          createdAt: '2026-03-01T09:00:00.000Z',
          visitorHash: 'hash-b',
          path: '/en/contact',
        },
        {
          createdAt: '2026-03-01T10:00:00.000Z',
          visitorHash: 'hash-c',
          path: '/fr/contact',
        },
      ],
      hasNextPage: false,
    })

    const analytics = await getAnalytics('30d')

    expect(analytics.topPages).toEqual(
      expect.arrayContaining([
        { path: '/fr/contact', views: 2, unique: 2 },
        { path: '/en/contact', views: 1, unique: 1 },
      ]),
    )
  })

  it('caps page-view pagination and warns when Payload keeps reporting more pages', async () => {
    findMock.mockResolvedValue({
      docs: [
        {
          createdAt: '2026-03-01T08:00:00.000Z',
          visitorHash: 'hash-a',
          path: '/fr/contact',
        },
      ],
      hasNextPage: true,
    })

    await getAnalytics('30d')

    expect(findMock).toHaveBeenCalledTimes(50)
    expect(loggerWarn).toHaveBeenCalledWith(
      'fetchAllPageViews hit MAX_PAGES cap (50)',
      'analytics',
    )
  })

  it('does not warn when the final fetched page is exactly the cap and no further page exists', async () => {
    for (let page = 1; page <= 49; page++) {
      findMock.mockResolvedValueOnce({
        docs: [
          {
            createdAt: '2026-03-01T08:00:00.000Z',
            visitorHash: `hash-${page}`,
            path: '/fr/contact',
          },
        ],
        hasNextPage: true,
      })
    }

    findMock.mockResolvedValueOnce({
      docs: [
        {
          createdAt: '2026-03-01T08:00:00.000Z',
          visitorHash: 'hash-final',
          path: '/fr/contact',
        },
      ],
      hasNextPage: false,
    })

    await getAnalytics('30d')

    expect(findMock).toHaveBeenCalledTimes(50)
    expect(loggerWarn).not.toHaveBeenCalled()
  })
})
