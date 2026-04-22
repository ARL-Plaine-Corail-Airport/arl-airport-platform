import type { AccessArgs } from 'payload'

// Shared by collection `Access` and field `FieldAccess` callers. Both receive
// `{ req }` with a user; narrowing to this subset lets the role helpers be
// reused at both levels without duplicating logic.
type RoleAccessArgs = { req: AccessArgs['req'] }

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
const DOCUMENT_READER_ROLES: Role[] = [...APPROVER_ROLES, 'operations_editor']
const ALL_ROLES: Role[] = [...EDITOR_ROLES, 'viewer_auditor']

// Destructive collection deletes use isAdmin unless a collection documents a
// narrower exception; approval rights alone should not imply delete rights.

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

export const isAdmin = ({ req }: RoleAccessArgs) => hasAnyRole(req.user, ADMIN_ROLES)

export const isSuperAdmin = ({ req }: RoleAccessArgs) => hasAnyRole(req.user, ['super_admin'])

export const isApprover = ({ req }: RoleAccessArgs) => hasAnyRole(req.user, APPROVER_ROLES)

export const isEditor = ({ req }: RoleAccessArgs) => hasAnyRole(req.user, EDITOR_ROLES)

export const isDocumentReader = ({ req }: RoleAccessArgs) =>
  hasAnyRole(req.user, DOCUMENT_READER_ROLES)

function publishedFieldOrAdmin(field: 'status' | '_status') {
  return ({ req }: AccessArgs) => {
    // Payload access can return true for full access or a Where constraint for scoped access.
    if (hasAnyRole(req.user, ADMIN_ROLES)) return true
    // Unauthenticated / low-privilege users only see published content.
    return { [field]: { equals: 'published' } }
  }
}

export const publishedOrAdmin = publishedFieldOrAdmin('status')

export const publishedVersionOrAdmin = publishedFieldOrAdmin('_status')
