import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  cachedFetchMock,
  countMock,
  findMock,
  getFlightBoardsMock,
  getPayloadClientMock,
  loggerErrorMock,
  requireDashboardSectionAccessMock,
} = vi.hoisted(() => ({
  cachedFetchMock: vi.fn(),
  countMock: vi.fn(),
  findMock: vi.fn(),
  getFlightBoardsMock: vi.fn(),
  getPayloadClientMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  requireDashboardSectionAccessMock: vi.fn(),
}))

vi.mock('@/lib/dashboard-auth', () => ({
  requireDashboardSectionAccess: requireDashboardSectionAccessMock,
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: getPayloadClientMock,
}))

vi.mock('@/lib/cache', () => ({
  cachedFetch: cachedFetchMock,
}))

vi.mock('@/lib/integrations/flights', () => ({
  getFlightBoards: getFlightBoardsMock,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerErrorMock,
  },
}))

vi.mock('@/lib/date', () => ({
  formatDate: (value: string) => value,
}))

const arrivalsBoard = {
  configured: true,
  records: [],
}

const departuresBoard = {
  configured: true,
  records: [],
}

describe('dashboard overview counts', () => {
  beforeEach(() => {
    cachedFetchMock.mockImplementation(async (_key, _ttl, fetcher) => fetcher())
    getFlightBoardsMock.mockResolvedValue({
      arrivals: arrivalsBoard,
      departures: departuresBoard,
      degraded: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('counts dashboard totals without loading full document lists', async () => {
    findMock.mockResolvedValue({ docs: [] })
    countMock.mockResolvedValue({ totalDocs: 0 })
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
      count: countMock,
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
    expect(cachedFetchMock).toHaveBeenCalledWith(
      'flights:rotations',
      2600,
      getFlightBoardsMock,
      expect.objectContaining({
        shouldCache: expect.any(Function),
      }),
    )
    expect(findMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 1000,
      }),
    )
  })

  it('renders a degraded state when core dashboard counts fail', async () => {
    const totalNoticesError = new Error('total notices down')
    const activeNoticesError = new Error('active notices down')
    const emergencyBannersError = new Error('emergency banners down')
    const usersError = new Error('users down')
    findMock.mockResolvedValue({ docs: [] })
    countMock
      .mockRejectedValueOnce(totalNoticesError)
      .mockRejectedValueOnce(activeNoticesError)
      .mockRejectedValueOnce(emergencyBannersError)
      .mockRejectedValueOnce(usersError)
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
      count: countMock,
    })
    const { default: DashboardOverviewPage } = await import('@/app/(dashboard)/dashboard/page')

    render(await DashboardOverviewPage())

    expect(screen.getByRole('status')).toHaveTextContent('Dashboard data is degraded.')
    expect(screen.getByRole('status')).toHaveTextContent('total notices')
    expect(screen.getByRole('status')).toHaveTextContent('active notices')
    expect(screen.getByRole('status')).toHaveTextContent('emergency banners')
    expect(screen.getByRole('status')).toHaveTextContent('admin users')
    expect(screen.queryByRole('heading', { name: 'Cannot reach database' })).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByText('All clear')).not.toBeInTheDocument()
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Failed to fetch total notices count',
      totalNoticesError,
      'dashboard',
    )
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Failed to fetch active notices count',
      activeNoticesError,
      'dashboard',
    )
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Failed to fetch users count',
      usersError,
      'dashboard',
    )
  })

  it('does not render fabricated recent activity when there is no real activity source', async () => {
    findMock.mockResolvedValue({ docs: [] })
    countMock.mockResolvedValue({ totalDocs: 0 })
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
      count: countMock,
    })
    const { default: DashboardOverviewPage } = await import('@/app/(dashboard)/dashboard/page')

    render(await DashboardOverviewPage())

    expect(screen.queryByRole('heading', { name: 'Recent Activity' })).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard initialised')).not.toBeInTheDocument()
    expect(screen.queryByText('Site settings configured')).not.toBeInTheDocument()
    expect(screen.queryByText('First admin user created')).not.toBeInTheDocument()
  })

  it('reports a single degraded source when the shared flight board snapshot fails', async () => {
    const flightBoardsError = new Error('flight boards down')
    findMock.mockResolvedValue({ docs: [] })
    countMock.mockResolvedValue({ totalDocs: 0 })
    cachedFetchMock.mockRejectedValueOnce(flightBoardsError)
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
      count: countMock,
    })

    const { default: DashboardOverviewPage } = await import('@/app/(dashboard)/dashboard/page')

    render(await DashboardOverviewPage())

    expect(screen.getByRole('status')).toHaveTextContent('flight boards')
    expect(screen.getByRole('status')).not.toHaveTextContent('arrivals board')
    expect(screen.getByRole('status')).not.toHaveTextContent('departures board')
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Failed to fetch flight boards',
      flightBoardsError,
      'dashboard',
    )
  })

  it('renders degraded UI instead of waiting forever when a data source stalls', async () => {
    vi.useFakeTimers()
    findMock.mockReturnValue(new Promise(() => undefined))
    countMock.mockResolvedValue({ totalDocs: 0 })
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
      count: countMock,
    })

    const { default: DashboardOverviewPage } = await import('@/app/(dashboard)/dashboard/page')
    const page = DashboardOverviewPage()

    await vi.advanceTimersByTimeAsync(8000)

    render(await page)

    expect(screen.getByRole('status')).toHaveTextContent('recent notices')
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'Failed to fetch recent notices',
      expect.objectContaining({
        message: 'recent notices timed out after 8000ms',
      }),
      'dashboard',
    )
  })
})
