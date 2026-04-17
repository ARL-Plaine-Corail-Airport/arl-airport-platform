import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'

export const ContactInfo: GlobalConfig = {
  slug: 'contact-info',
  access: {
    read: () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Help desk contact cards and general enquiry details shown on the Contact page.',
  },
  fields: [
    {
      name: 'helpDeskTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Contact and help desk',
    },
    {
      name: 'helpDeskSummary',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'Use the official help desk details below for passenger information, accessibility assistance, and general airport enquiries.',
    },
    {
      name: 'cards',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'value', type: 'textarea', required: true, localized: true },
        {
          name: 'link',
          type: 'text',
          validate: (value: string | null | undefined) => {
            if (!value) return true
            if (/^(tel:|mailto:)/.test(value)) return true
            try {
              new URL(value)
              return true
            } catch {
              return 'Enter a tel:, mailto:, or https:// link.'
            }
          },
          admin: { placeholder: 'tel:+23083278888 or mailto:info@arl.aero' },
        },
      ],
    },
  ],
}
