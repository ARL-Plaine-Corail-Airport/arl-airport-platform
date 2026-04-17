// =============================================================================
// Legal Pages Global
//
// Disclaimer, Terms of Use, and Privacy Policy.
//
// GOVERNANCE:
// - These pages must be reviewed and approved by management/legal before publishing.
// - Changes require Approver-level access.
// - Version history is retained (max 50) for audit and legal traceability.
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isApprover } from '@/access'

export const LegalPages: GlobalConfig = {
  slug: 'legal-pages',
  access: {
    read:   () => true,
    update: isApprover, // Legal content requires elevated access
  },
  admin: {
    group: 'Settings & Legal',
    description: 'Disclaimer, Terms of Use, and Privacy Policy. Changes require Approver access.',
  },
  versions: {
    drafts: true,
    max: 50,
  },
  fields: [
    {
      name: 'disclaimer',
      label: 'Disclaimer',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Page Title',
          type: 'text',
          required: true,
          localized: true,
          defaultValue: 'Disclaimer',
        },
        {
          name: 'content',
          label: 'Content',
          type: 'richText',
          required: true,
          localized: true,
        },
        {
          name: 'lastUpdated',
          label: 'Last Updated',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      name: 'termsOfUse',
      label: 'Terms of Use',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Page Title',
          type: 'text',
          required: true,
          localized: true,
          defaultValue: 'Terms of Use',
        },
        {
          name: 'content',
          label: 'Content',
          type: 'richText',
          required: true,
          localized: true,
        },
        {
          name: 'lastUpdated',
          label: 'Last Updated',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'effectiveDate',
          label: 'Effective Date',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      name: 'privacyPolicy',
      label: 'Privacy Policy',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Page Title',
          type: 'text',
          required: true,
          localized: true,
          defaultValue: 'Privacy Policy',
        },
        {
          name: 'content',
          label: 'Content',
          type: 'richText',
          required: true,
          localized: true,
          admin: {
            description: 'Must comply with applicable data protection legislation (e.g. Mauritius Data Protection Act 2017).',
          },
        },
        {
          name: 'lastUpdated',
          label: 'Last Updated',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'dataControllerName',
          label: 'Data Controller Name',
          type: 'text',
        },
        {
          name: 'dataControllerEmail',
          label: 'Data Controller Contact Email',
          type: 'email',
          admin: { placeholder: 'dpo@arl.aero' },
        },
      ],
    },
    {
      name: 'cookiePolicy',
      label: 'Cookie Policy',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Page Title',
          type: 'text',
          localized: true,
          defaultValue: 'Cookie Policy',
        },
        {
          name: 'content',
          label: 'Content',
          type: 'richText',
          localized: true,
        },
        {
          name: 'lastUpdated',
          label: 'Last Updated',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
  ],
}
