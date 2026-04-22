import 'server-only'

import { cache } from 'react'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { defaultLocale, isValidLocale, type Locale } from '@/i18n/config'
import {
  canAccessAny,
  getInitials,
  getPrimaryRole,
  getRoleBadgeClass,
  getRoleLabel,
} from '@/lib/dashboard'
import type { DashboardRole } from '@/lib/dashboard'
import { getPayloadClient } from '@/lib/payload'
import type { User } from '@/payload-types'

type DashboardUser = User & { roles: string[] }

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
  primaryRole: DashboardRole
  fullName: string
  initials: string
  roleLabel: string
  roleBadgeClass: string
  locale: Locale
}

function resolveDashboardLocale(user: DashboardUser, cookieLocale: string): Locale {
  if (user.preferredLocale && isValidLocale(user.preferredLocale)) {
    return user.preferredLocale
  }
  if (isValidLocale(cookieLocale)) return cookieLocale
  return defaultLocale
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
  if (!primaryRole) {
    redirect('/admin')
  }
  const fullName = dashboardUser.fullName?.trim() || dashboardUser.email || 'User'
  const requestCookies = await cookies()
  const locale = resolveDashboardLocale(dashboardUser, requestCookies.get('locale')?.value ?? '')

  return {
    user: dashboardUser,
    roles,
    primaryRole,
    fullName,
    initials: getInitials(fullName),
    roleLabel: getRoleLabel(primaryRole),
    roleBadgeClass: getRoleBadgeClass(primaryRole),
    locale,
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
