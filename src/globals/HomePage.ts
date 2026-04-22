import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  access: {
    // Public global: the homepage content is intentionally available to unauthenticated clients.
    read: () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Controls the hero section, service previews, and emergency alert area on the public homepage.',
  },
  fields: [
    {
      name: 'heroTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Official passenger information for Plaine Corail Airport',
    },
    {
      name: 'heroSummary',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'Check arrivals and departures, read official communiqués, prepare your journey, and access transport, accessibility, and contact information from one mobile-first platform.',
    },
    {
      name: 'servicesPreview',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'summary', type: 'textarea', required: true },
      ],
    },
    {
      name: 'emergencyAlertTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Important operational information',
    },
    {
      name: 'emergencyAlertBody',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Urgent communiqués and service disruptions can be promoted here from the notices workflow when approved for site-wide display.',
    },
  ],
}
