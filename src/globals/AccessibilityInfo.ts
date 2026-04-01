import type { GlobalConfig, Field } from 'payload'

import { isEditor } from '@/access'
import { sectionFields } from '@/fields/sectionFields'

export const AccessibilityInfo: GlobalConfig = {
  slug: 'accessibility-info',
  access: {
    read: () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Accessibility support details, reduced mobility assistance, and accessible facilities information.',
  },
  fields: [
    {
      name: 'introTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Accessibility support',
    },
    {
      name: 'introSummary',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'Find information about reduced mobility assistance, terminal accessibility, accessible parking, and support contacts.',
    },
    ...sectionFields,
    {
      name: 'assistanceContact',
      type: 'text',
      defaultValue: 'Contact the help desk or your airline in advance to request assistance.',
    },
  ] satisfies Field[],
}
