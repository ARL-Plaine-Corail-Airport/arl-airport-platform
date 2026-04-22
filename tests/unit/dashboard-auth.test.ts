import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  cookiesMock,
  headersMock,
  redirectMock,
  canAccessAny,
  getInitials,
  getPrimaryRole,
  getRoleBadgeClass,
  getRoleLabel,
  getPayloadClient,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
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
  cookies: cookiesMock,
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

function mockLocaleCookie(value?: string) {
  cookiesMock.mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name !== 'locale' || !value) return undefined
      return { value }
    }),
  })
}

describe('dashboard auth helpers', () => {
  beforeEach(() => {
    mockLocaleCookie()
  })

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
      locale: 'en',
    })
  })

  it('prefers a valid dashboard user preferred locale over the locale cookie', async () => {
    headersMock.mockResolvedValue(new Headers())
    mockLocaleCookie('fr')
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({
        user: {
          email: 'translator@example.com',
          fullName: 'Airport Translator',
          preferredLocale: 'mfe',
          roles: ['translator'],
        },
      }),
    })
    getPrimaryRole.mockReturnValue('translator')
    getInitials.mockReturnValue('AT')
    getRoleLabel.mockReturnValue('Translator')
    getRoleBadgeClass.mockReturnValue('role-viewer')

    const { getDashboardSession } = await import('@/lib/dashboard-auth')

    await expect(getDashboardSession()).resolves.toMatchObject({
      locale: 'mfe',
    })
  })

  it('uses a valid locale cookie when the user has no preferred locale', async () => {
    headersMock.mockResolvedValue(new Headers())
    mockLocaleCookie('fr')
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({
        user: {
          email: 'approver@example.com',
          roles: ['approver'],
        },
      }),
    })
    getPrimaryRole.mockReturnValue('approver')
    getInitials.mockReturnValue('A')
    getRoleLabel.mockReturnValue('Approver')
    getRoleBadgeClass.mockReturnValue('role-editor')

    const { getDashboardSession } = await import('@/lib/dashboard-auth')

    await expect(getDashboardSession()).resolves.toMatchObject({
      locale: 'fr',
    })
  })

  it('falls back to email when the dashboard full name is blank', async () => {
    headersMock.mockResolvedValue(new Headers())
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({
        user: {
          email: 'admin@example.com',
          fullName: '   ',
          roles: ['super_admin'],
        },
      }),
    })
    getPrimaryRole.mockReturnValue('super_admin')
    getInitials.mockReturnValue('A')
    getRoleLabel.mockReturnValue('Super Admin')
    getRoleBadgeClass.mockReturnValue('role-super')

    const { getDashboardSession } = await import('@/lib/dashboard-auth')

    await expect(getDashboardSession()).resolves.toMatchObject({
      fullName: 'admin@example.com',
      initials: 'A',
    })
    expect(getInitials).toHaveBeenCalledWith('admin@example.com')
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

  it('redirects users with no valid dashboard role', async () => {
    headersMock.mockResolvedValue(new Headers())
    getPayloadClient.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({
        user: {
          email: 'viewer@example.com',
          roles: ['unknown_role'],
        },
      }),
    })
    getPrimaryRole.mockReturnValue(null)

    const { getDashboardSession } = await import('@/lib/dashboard-auth')

    await expect(getDashboardSession()).rejects.toThrow('redirect:/admin')
  })
})
