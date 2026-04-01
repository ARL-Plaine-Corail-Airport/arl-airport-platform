import type { CollectionConfig } from 'payload'

import { isAdmin, isEditor } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'updatedAt'],
    group: 'System',
  },
  access: {
    admin: isEditor,
    read: isAdmin,
    update: isAdmin,
    create: isAdmin,
    delete: isAdmin,
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
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Governance flag. Enforce at the identity-provider or auth layer in production.',
      },
    },
  ],
}
