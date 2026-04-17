import type { GlobalConfig, Field } from 'payload'

import { isEditor } from '@/access'
import { sectionFields } from '@/fields/sectionFields'

export const TransportParking: GlobalConfig = {
  slug: 'transport-parking',
  access: {
    read: () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Transport options, parking, and direction information for the Transport & Parking page.',
  },
  fields: [
    {
      name: 'introTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Transport and parking information',
    },
    {
      name: 'introSummary',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'Review drop-off, pickup, car park, taxi, bus, shuttle, and direction information before travelling to the airport.',
    },
    ...sectionFields,
    {
      name: 'mapEmbedURL',
      type: 'text',
      validate: (value: string | null | undefined) => {
        if (!value) return true
        try {
          new URL(value)
          return true
        } catch {
          return 'Please enter a valid URL.'
        }
      },
      admin: { placeholder: 'https://www.google.com/maps/embed?...' },
    },
  ] satisfies Field[],
}
