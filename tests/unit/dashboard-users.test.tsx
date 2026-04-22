import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const {
  countMock,
  findMock,
  getPayloadClientMock,
  requireDashboardSectionAccessMock,
} = vi.hoisted(() => ({
  countMock: vi.fn(),
  findMock: vi.fn(),
  getPayloadClientMock: vi.fn(),
  requireDashboardSectionAccessMock: vi.fn(),
}))

vi.mock('@/lib/dashboard-auth', () => ({
  requireDashboardSectionAccess: requireDashboardSectionAccessMock,
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient: getPayloadClientMock,
}))

vi.mock('@/lib/date', () => ({
  formatDate: (value: string) => value,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('dashboard users page', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('scopes role tabs in the Payload query and computes counts from count calls', async () => {
    findMock.mockResolvedValue({
      docs: [
        {
          id: 1,
          email: 'editor@example.com',
          fullName: 'Editor One',
          roles: ['content_admin'],
          updatedAt: '2026-04-21T00:00:00.000Z',
        },
      ],
    })
    countMock
      .mockResolvedValueOnce({ totalDocs: 501 })
      .mockResolvedValueOnce({ totalDocs: 7 })
      .mockResolvedValueOnce({ totalDocs: 33 })
      .mockResolvedValueOnce({ totalDocs: 44 })
    getPayloadClientMock.mockResolvedValue({
      find: findMock,
      count: countMock,
    })

    const { default: UsersPage } = await import('@/app/(dashboard)/dashboard/users/page')

    render(await UsersPage({ searchParams: Promise.resolve({ tab: 'editors' }) }))

    expect(requireDashboardSectionAccessMock).toHaveBeenCalledWith('users')
    expect(findMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        limit: 200,
        where: {
          or: [
            { roles: { contains: 'content_admin' } },
            { roles: { contains: 'approver' } },
            { roles: { contains: 'operations_editor' } },
          ],
        },
      }),
    )
    expect(countMock).toHaveBeenCalledTimes(4)
    expect(countMock).toHaveBeenCalledWith({
      collection: 'users',
      overrideAccess: true,
    })
    expect(countMock).toHaveBeenCalledWith({
      collection: 'users',
      overrideAccess: true,
      where: {
        roles: {
          contains: 'super_admin',
        },
      },
    })
    expect(countMock).toHaveBeenCalledWith({
      collection: 'users',
      overrideAccess: true,
      where: {
        or: [
          { roles: { contains: 'content_admin' } },
          { roles: { contains: 'approver' } },
          { roles: { contains: 'operations_editor' } },
        ],
      },
    })
    expect(countMock).toHaveBeenCalledWith({
      collection: 'users',
      overrideAccess: true,
      where: {
        or: [
          { roles: { contains: 'translator' } },
          { roles: { contains: 'viewer_auditor' } },
        ],
      },
    })
    expect(screen.getAllByText('501')).toHaveLength(2)
    expect(screen.getAllByText('7')).toHaveLength(2)
    expect(screen.getAllByText('33')).toHaveLength(2)
    expect(screen.getAllByText('44')).toHaveLength(2)
    expect(screen.getByText('Editor One')).toBeInTheDocument()
  })
})
