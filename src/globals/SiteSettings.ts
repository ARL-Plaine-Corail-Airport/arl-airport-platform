import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: isEditor,
  },
  admin: {
    group: 'Settings & Legal',
    description: 'Global site identity: name, contact details, social links, and default SEO metadata.',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Airport of Rodrigues Ltd',
    },
    {
      name: 'airportName',
      type: 'text',
      required: true,
      defaultValue: 'Plaine Corail Airport',
    },
    {
      name: 'tagline',
      type: 'textarea',
      defaultValue:
        'Official passenger information platform for operational notices, flight information, passenger guidance, and mobile-first access.',
    },
    {
      name: 'primaryPhone',
      type: 'text',
      defaultValue: '+230 832 78 88',
      admin: { placeholder: '+230 832 78 88' },
    },
    {
      name: 'primaryEmail',
      type: 'email',
      defaultValue: 'info@arl.aero',
      admin: { placeholder: 'info@arl.aero' },
    },
    {
      name: 'physicalAddress',
      type: 'textarea',
      defaultValue: 'Plaine Corail Airport, Rodrigues Island, Republic of Mauritius',
    },
    {
      name: 'workingHours',
      type: 'textarea',
      defaultValue: 'Operational hours may vary by flight schedule and official notices.',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'url',
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
          admin: { placeholder: 'https://facebook.com/...' },
        },
      ],
    },
    {
      name: 'usefulLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'url',
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
          admin: { placeholder: 'https://example.com' },
        },
      ],
    },
    {
      name: 'seoDefaultTitle',
      type: 'text',
      defaultValue: 'Rodrigues Airport Passenger Information Platform',
    },
    {
      name: 'seoDefaultDescription',
      type: 'textarea',
      defaultValue:
        'Official mobile-first platform for Plaine Corail Airport arrivals, departures, communiques, passenger guidance, accessibility, transport, and airport contact information.',
    },
    {
      name: 'defaultOgImage',
      label: 'Default Open Graph Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Fallback image used for social sharing when a page has no featured image. Recommended size: 1200x630.',
      },
    },
  ],
}
