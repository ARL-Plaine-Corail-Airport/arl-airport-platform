import { describe, expect, it, vi } from 'vitest'

const { countMock, findMock, getFlightBoardMock, getPayloadClientMock, requireDashboardSectionAccessMock } = vi.hoisted(() => ({
  countMock: vi.fn(),
  findMock: vi.fn(),
  getFlightBoardMock: vi.fn(),
  getPayloadClientMock: vi.fn(),
  requireDashboardSectionAccessMock: vi.fn(),
}))

vi.mock('@/lib/dashboard-auth', () => ({
  requireDashboardSectionAccess: requireDashboardSectionAccessMock,
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: getPayloadClientMock,
}))

vi.mock('@/lib/integrations/flights', () => ({
  getFlightBoard: getFlightBoardMock,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

vi.mock('@/lib/date', () => ({
  formatDate: (value: string) => value,
}))

describe('dashboard overview counts', () => {
  it('counts dashboard totals without loading full document lists', async () => {
    findMock.mockResolvedValue({ docs: [] })
    countMock.mockResolvedValue({ totalDocs: 0 })
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
      count: countMock,
    })
    getFlightBoardMock.mockResolvedValue({
      configured: true,
      records: [],
    })

    const { default: DashboardOverviewPage } = await import('@/app/(dashboard)/dashboard/page')

    await DashboardOverviewPage()

    expect(requireDashboardSectionAccessMock).toHaveBeenCalledWith('overview')
    expect(findMock).toHaveBeenCalledTimes(1)
    expect(findMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'notices',
        limit: 5,
        depth: 0,
      }),
    )
    expect(countMock).toHaveBeenCalledTimes(4)
    expect(countMock).toHaveBeenCalledWith({
      collection: 'users',
      overrideAccess: true,
    })
    expect(findMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 1000,
      }),
    )
  })
})
