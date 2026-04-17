import 'server-only'

import { cache } from 'react'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { canAccessAny, getInitials, getPrimaryRole, getRoleBadgeClass, getRoleLabel } from '@/lib/dashboard'
import { getPayloadClient } from '@/lib/payload'

type DashboardUser = {
  email?: string | null
  fullName?: string | null
  roles: string[]
} & Record<string, unknown>

function isDashboardUser(user: unknown): user is DashboardUser {
  if (!user || typeof user !== 'object') {
    return false
  }

  const { roles } = user as { roles?: unknown }

  return Array.isArray(roles) && roles.every((role) => typeof role === 'string')
}

export type DashboardSession = {
  user: DashboardUser
  roles: string[]
  primaryRole: ReturnType<typeof getPrimaryRole>
  fullName: string
  initials: string
  roleLabel: string
  roleBadgeClass: string
}

export const getDashboardSession = cache(async (): Promise<DashboardSession> => {
  const requestHeaders = await headers()
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!isDashboardUser(user)) {
    redirect('/admin/login')
  }

  const dashboardUser = user
  const roles = dashboardUser.roles

  if (roles.length === 0) {
    redirect('/admin')
  }

  const primaryRole = getPrimaryRole(roles)
  const fullName = dashboardUser.fullName || dashboardUser.email || 'User'

  return {
    user: dashboardUser,
    roles,
    primaryRole,
    fullName,
    initials: getInitials(fullName),
    roleLabel: getRoleLabel(primaryRole),
    roleBadgeClass: getRoleBadgeClass(primaryRole),
  }
})

export async function requireDashboardSectionAccess(section: string) {
  const session = await getDashboardSession()

  // Section-level access is enforced server-side here after payload.auth().
  if (!canAccessAny(session.roles, section)) {
    redirect('/dashboard')
  }

  return session
}
