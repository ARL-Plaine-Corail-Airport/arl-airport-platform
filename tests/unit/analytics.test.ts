import { beforeEach, describe, expect, it, vi } from 'vitest'

const { drizzleExecuteMock, findMock, getPayloadClientMock, loggerError, loggerWarn } = vi.hoisted(() => ({
  drizzleExecuteMock: vi.fn(),
  findMock: vi.fn(),
  getPayloadClientMock: vi.fn(),
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
  getPayloadClient: getPayloadClientMock,
}))

import { getAnalytics } from '@/lib/analytics'

describe('getAnalytics', () => {
  beforeEach(() => {
    findMock.mockReset()
    drizzleExecuteMock.mockReset()
    getPayloadClientMock.mockReset()
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
    })
    loggerError.mockReset()
    loggerWarn.mockReset()
  })

  it('uses DB-side aggregation when Payload exposes a Drizzle executor', async () => {
    getPayloadClientMock.mockResolvedValue({
      db: {
        drizzle: {
          execute: drizzleExecuteMock,
        },
      },
    })
    drizzleExecuteMock
      .mockResolvedValueOnce({ rows: [{ total_views: '4' }] })
      .mockResolvedValueOnce({ rows: [{ daily_unique_visitors: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ path: '/en/contact', views: '3', unique: '2' }],
      })
      .mockResolvedValueOnce({
        rows: [
          { source: 'direct', sessions: '3' },
          { source: 'google.com', sessions: '1' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ label: 'mobile', count: '4' }],
      })
      .mockResolvedValueOnce({
        rows: [{ label: 'fr', count: '4' }],
      })
      .mockResolvedValueOnce({
        rows: [{ date: '2026-04-17', views: '4' }],
      })

    const analytics = await getAnalytics('7d')

    expect(drizzleExecuteMock).toHaveBeenCalledTimes(7)
    expect(findMock).not.toHaveBeenCalled()
    expect(analytics).toMatchObject({
      dailyUniqueVisitors: 2,
      pageViews: 4,
      topPages: [{ path: '/en/contact', views: 3, unique: 2 }],
      referrers: [
        { source: 'Direct / Bookmark', sessions: 3, percentage: 75 },
        { source: 'Google Search', sessions: 1, percentage: 25 },
      ],
      devices: [{ label: 'Mobile', value: 100 }],
      languages: [{ label: 'French', value: 100 }],
      truncated: false,
    })
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
