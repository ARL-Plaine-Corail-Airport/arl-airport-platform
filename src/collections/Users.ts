import type { CollectionBeforeDeleteHook, CollectionConfig, FieldAccess } from 'payload'

import { isAdmin, isSuperAdmin } from '@/access'
import { defaultLocale, type Locale } from '@/i18n/config'

const canUpdateRoles = (({ data, doc, req, siblingData }) => {
  if (isSuperAdmin({ req })) return true

  const nextRoles = (siblingData as { roles?: unknown } | undefined)?.roles
    ?? (data as { roles?: unknown } | undefined)?.roles
  const currentRoles = (doc as { roles?: unknown } | undefined)?.roles

  if (Array.isArray(nextRoles) && nextRoles.includes('super_admin')) return false
  if (Array.isArray(currentRoles) && currentRoles.includes('super_admin')) return false

  return isAdmin({ req })
}) satisfies FieldAccess

type UserWithRoles = {
  roles?: unknown
}

const preventUnsafeUserDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (req.user?.id && String(req.user.id) === String(id)) {
    throw new Error('You cannot delete your own account.')
  }

  const targetUser = await req.payload.findByID({
    collection: 'users',
    id,
    depth: 0,
    overrideAccess: true,
  }) as UserWithRoles | null

  const targetRoles = Array.isArray(targetUser?.roles) ? targetUser.roles : []
  if (!targetRoles.includes('super_admin')) return

  const superAdminCount = await req.payload.count({
    collection: 'users',
    where: {
      roles: {
        contains: 'super_admin',
      },
    },
    overrideAccess: true,
  })

  if (superAdminCount.totalDocs <= 1) {
    throw new Error('Cannot delete the last super admin.')
  }
}

const preferredLocaleOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Kreol Morisien', value: 'mfe' },
] satisfies Array<{ label: string; value: Locale }>

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'preferredLocale', 'updatedAt'],
    group: 'System',
  },
  access: {
    admin: isAdmin,
    read: ({ req }) => {
      if (isAdmin({ req })) return true
      if (req.user?.id) return { id: { equals: req.user.id } }
      return false
    },
    update: isAdmin,
    create: isAdmin,
    delete: ({ req }) => isSuperAdmin({ req }),
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['operations_editor'],
      access: {
        read: ({ req }) => isAdmin({ req }),
        create: canUpdateRoles,
        update: canUpdateRoles,
      },
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Content Admin', value: 'content_admin' },
        { label: 'Approver', value: 'approver' },
        { label: 'Operations Editor', value: 'operations_editor' },
        { label: 'Translator', value: 'translator' },
        { label: 'Viewer / Auditor', value: 'viewer_auditor' },
      ],
    },
    {
      name: 'mfaRequired',
      label: 'MFA Required (advisory - not enforced)',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'This flag is not currently enforced. Do not rely on it as a security control.',
      },
    },
    {
      name: 'preferredLocale',
      type: 'select',
      defaultValue: defaultLocale,
      admin: {
        description: 'Preferred dashboard language.',
      },
      options: preferredLocaleOptions,
    },
  ],
  hooks: {
    beforeDelete: [preventUnsafeUserDelete],
  },
}
