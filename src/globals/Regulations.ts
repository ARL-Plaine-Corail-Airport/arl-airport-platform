// =============================================================================
// Regulations Global
//
// Airport rules, conditions of entry, airside conduct, and regulatory notices.
// Content is admin-managed. Linked documents (PDFs) go to arl-protected-docs.
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'

export const Regulations: GlobalConfig = {
  slug: 'regulations',
  access: {
    read:   () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Airport rules, conditions of entry, and regulatory notices. Links to official regulation PDFs.',
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
      defaultValue: 'Airport Regulations',
    },
    {
      name: 'introduction',
      label: 'Introduction',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'sections',
      label: 'Regulation Sections',
      type: 'array',
      fields: [
        {
          name: 'heading',
          label: 'Section Heading',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'body',
          label: 'Content',
          type: 'richText',
          localized: true,
        },
        {
          name: 'attachedDocument',
          label: 'Attached Regulation Document (PDF)',
          type: 'upload',
          relationTo: 'documents',
          admin: {
            description: 'Optionally link the official regulation PDF (stored in protected docs bucket).',
          },
        },
      ],
    },
    {
      name: 'lastReviewedDate',
      label: 'Last Reviewed Date',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'The date these regulations were last reviewed by airport authority.',
      },
    },
    {
      name: 'legalDisclaimer',
      label: 'Legal Disclaimer',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Optional disclaimer text shown at the bottom of the regulations page.',
      },
    },
  ],
}
