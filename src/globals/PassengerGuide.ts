import type { GlobalConfig, Field } from 'payload'

import { isEditor } from '@/access'
import { sectionFields } from '@/fields/sectionFields'

export const PassengerGuide: GlobalConfig = {
  slug: 'passenger-guide',
  access: {
    read: () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Check-in, baggage, security, and travel preparation guidance displayed on the Passenger Guide page.',
  },
  fields: [
    {
      name: 'introTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Prepare for your journey',
    },
    {
      name: 'introSummary',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'Use this guide to review check-in, baggage, security, accessibility support, and key airport contact information before travelling.',
    },
    ...sectionFields,
    {
      name: 'importantContacts',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
  ] satisfies Field[],
}
