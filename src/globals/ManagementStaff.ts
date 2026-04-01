// =============================================================================
// Management & Staff Global
//
// Airport management structure and key personnel.
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isEditor, publishedOrAdmin } from '@/access'

export const ManagementStaff: GlobalConfig = {
  slug: 'management-staff',
  access: {
    read:   publishedOrAdmin,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Airport management team profiles, biographies, and departmental overview.',
  },
  versions: {
    drafts: true,
    max: 20,
  },
  fields: [
    {
      name: 'pageTitle',
      label: 'Page Title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Management & Staff',
    },
    {
      name: 'introduction',
      label: 'Introduction',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'managementTeam',
      label: 'Management Team',
      type: 'array',
      fields: [
        {
          name: 'name',
          label: 'Full Name',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          label: 'Job Title / Role',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'photo',
          label: 'Photo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'bio',
          label: 'Short Biography',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'department',
          label: 'Department',
          type: 'text',
          localized: true,
        },
        {
          name: 'displayOrder',
          label: 'Display Order',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'isVisible',
          label: 'Visible on Website',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Uncheck to hide this person without deleting their record.',
          },
        },
      ],
    },
    {
      name: 'departments',
      label: 'Departments Overview',
      type: 'array',
      admin: {
        description: 'Optional organisational overview by department.',
      },
      fields: [
        {
          name: 'departmentName',
          label: 'Department Name',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          localized: true,
        },
      ],
    },
  ],
}
