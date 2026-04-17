import { afterEach, describe, expect, it, vi } from 'vitest'

const {
  headersMock,
  redirectMock,
  canAccessAny,
  getInitials,
  getPrimaryRole,
  getRoleBadgeClass,
  getRoleLabel,
  getPayloadClient,
} = vi.hoisted(() => ({
  headersMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
  canAccessAny: vi.fn(),
  getInitials: vi.fn(),
  getPrimaryRole: vi.fn(),
  getRoleBadgeClass: vi.fn(),
  getRoleLabel: vi.fn(),
  getPayloadClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: headersMock,
}))

vi.mock('server-only', () => ({}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('@/lib/dashboard', () => ({
  canAccessAny,
  getInitials,
  getPrimaryRole,
  getRoleBadgeClass,
  getRoleLabel,
}))

vi.mock('@/lib/payload', () => ({
  getPayloadClient,
}))

describe('dashboard auth helpers', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('builds a dashboard session for authenticated users with roles', async () => {
    headersMock.mockResolvedValue(new Headers())
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({
        user: {
          email: 'admin@example.com',
          fullName: 'Airport Admin',
          roles: ['super_admin'],
        },
      }),
    })
    getPrimaryRole.mockReturnValue('super_admin')
    getInitials.mockReturnValue('AA')
    getRoleLabel.mockReturnValue('Super Admin')
    getRoleBadgeClass.mockReturnValue('role-super')

    const { getDashboardSession } = await import('@/lib/dashboard-auth')

    await expect(getDashboardSession()).resolves.toEqual({
      user: {
        email: 'admin@example.com',
        fullName: 'Airport Admin',
        roles: ['super_admin'],
      },
      roles: ['super_admin'],
      primaryRole: 'super_admin',
      fullName: 'Airport Admin',
      initials: 'AA',
      roleLabel: 'Super Admin',
      roleBadgeClass: 'role-super',
    })
  })

  it('redirects unauthenticated users to the admin login', async () => {
    headersMock.mockResolvedValue(new Headers())
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: null }),
    })

    const { getDashboardSession } = await import('@/lib/dashboard-auth')

    await expect(getDashboardSession()).rejects.toThrow('redirect:/admin/login')
  })

  it('redirects users without section access back to the dashboard root', async () => {
    headersMock.mockResolvedValue(new Headers())
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({
        user: {
          email: 'viewer@example.com',
          roles: ['viewer_auditor'],
        },
      }),
    })
    getPrimaryRole.mockReturnValue('viewer_auditor')
    getInitials.mockReturnValue('V')
    getRoleLabel.mockReturnValue('Viewer / Auditor')
    getRoleBadgeClass.mockReturnValue('role-viewer')
    canAccessAny.mockReturnValue(false)

    const { requireDashboardSectionAccess } = await import('@/lib/dashboard-auth')

    await expect(requireDashboardSectionAccess('analytics')).rejects.toThrow(
      'redirect:/dashboard',
    )
  })
})
