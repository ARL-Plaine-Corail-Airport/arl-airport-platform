// =============================================================================
// Useful Links Global
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'
import { enforceApproverOnPublish } from './approvalGuards'

export const UsefulLinks: GlobalConfig = {
  slug: 'useful-links',
  access: {
    read:   () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Curated external links grouped by category, displayed on the Useful Links page.',
  },
  versions: {
    drafts: true,
    max: 10,
  },
  fields: [
    {
      name: 'pageTitle',
      label: 'Page Title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Useful Links',
    },
    {
      name: 'introduction',
      label: 'Introduction',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'linkGroups',
      label: 'Link Groups',
      type: 'array',
      fields: [
        {
          name: 'groupName',
          label: 'Group Name',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'links',
          label: 'Links',
          type: 'array',
          fields: [
            {
              name: 'label',
              label: 'Label',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'url',
              label: 'URL',
              type: 'text',
              required: true,
              validate: (value: string | null | undefined) => {
                if (!value) return 'URL is required.'
                try {
                  new URL(value)
                  return true
                } catch {
                  return 'Please enter a valid URL (e.g. https://example.com).'
                }
              },
              admin: {
                description: 'Full URL including https://',
                placeholder: 'https://example.com',
              },
            },
            {
              name: 'description',
              label: 'Description (optional)',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'openInNewTab',
              label: 'Open in New Tab',
              type: 'checkbox',
              defaultValue: true,
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      enforceApproverOnPublish('Only approvers can publish useful links.'),
    ],
  },
}
