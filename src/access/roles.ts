import type { AccessArgs } from 'payload'

type Role =
  | 'super_admin'
  | 'content_admin'
  | 'approver'
  | 'operations_editor'
  | 'translator'
  | 'viewer_auditor'

const ADMIN_ROLES: Role[] = ['super_admin', 'content_admin']
const APPROVER_ROLES: Role[] = [...ADMIN_ROLES, 'approver']
const EDITOR_ROLES: Role[] = [...APPROVER_ROLES, 'operations_editor', 'translator']
const ALL_ROLES: Role[] = [...EDITOR_ROLES, 'viewer_auditor']

function getRoles(user: unknown): Role[] {
  if (!user || typeof user !== 'object') return []

  const roles = (user as { roles?: unknown }).roles
  if (!Array.isArray(roles)) return []

  return roles.filter(
    (role): role is Role => typeof role === 'string' && ALL_ROLES.includes(role as Role),
  )
}

function hasAnyRole(user: unknown, allowedRoles: readonly Role[]) {
  const roles = getRoles(user)
  return roles.some((role) => allowedRoles.includes(role))
}

export const isAdmin = ({ req }: AccessArgs) => hasAnyRole(req.user, ADMIN_ROLES)

export const isApprover = ({ req }: AccessArgs) => hasAnyRole(req.user, APPROVER_ROLES)

export const isEditor = ({ req }: AccessArgs) => hasAnyRole(req.user, EDITOR_ROLES)

export const publishedOrAdmin = ({ req }: AccessArgs) => {
  if (hasAnyRole(req.user, ADMIN_ROLES)) return true
  // Unauthenticated / low-privilege users only see published content
  return { status: { equals: 'published' } }
}
