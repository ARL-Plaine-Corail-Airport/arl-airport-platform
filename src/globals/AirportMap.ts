import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'

export const AirportMap: GlobalConfig = {
  slug: 'airport-map',
  access: {
    read: () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Terminal map, embed URL, and key points of interest displayed on the Airport Map page.',
  },
  fields: [
    {
      name: 'introTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Airport map and key points',
    },
    {
      name: 'introSummary',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'Locate terminal approaches, parking zones, pickup points, accessibility areas, and transport connection points.',
    },
    {
      name: 'mapEmbedURL',
      type: 'text',
      admin: { placeholder: 'https://www.google.com/maps/embed?...' },
    },
    {
      name: 'points',
      type: 'array',
      labels: { singular: 'Point of Interest', plural: 'Points of Interest' },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: 'Terminal', value: 'terminal' },
            { label: 'Parking', value: 'parking' },
            { label: 'Transport', value: 'transport' },
            { label: 'Accessibility', value: 'accessibility' },
            { label: 'Security', value: 'security' },
            { label: 'Services', value: 'services' },
          ],
        },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'lat',
          type: 'number',
          admin: { placeholder: '-19.7577', description: 'Latitude (decimal degrees)' },
        },
        {
          name: 'lng',
          type: 'number',
          admin: { placeholder: '63.3610', description: 'Longitude (decimal degrees)' },
        },
      ],
    },
  ],
}
