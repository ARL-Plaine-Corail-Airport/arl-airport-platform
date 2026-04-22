// =============================================================================
// Working Hours & Directions Global
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'
import { validateMapEmbedURL, validateURL } from '@/fields/validators'
import { enforceApproverOnPublish } from './approvalGuards'

export const WorkingHoursDirections: GlobalConfig = {
  slug: 'working-hours-directions',
  access: {
    read:   () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Airport operating hours, department schedules, location, and directions for getting here.',
  },
  versions: {
    drafts: true,
    max: 15,
  },
  fields: [
    {
      name: 'pageTitle',
      label: 'Page Title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Working Hours & Directions',
    },
    {
      name: 'opHours',
      label: 'Airport Operating Hours',
      type: 'group',
      fields: [
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'General operating hours. Note any seasonal variations.',
          },
        },
        {
          name: 'schedule',
          label: 'Hours Schedule',
          type: 'array',
          fields: [
            {
              name: 'dayOrPeriod',
              label: 'Day / Period',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'hours',
              label: 'Hours',
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'departmentHours',
      label: 'Specific Department Hours',
      type: 'array',
      admin: {
        description: 'Hours for check-in, customs, cargo, etc. if they differ from airport hours.',
      },
      fields: [
        {
          name: 'department',
          label: 'Department / Service',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'hours',
          label: 'Hours',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          localized: true,
        },
      ],
    },
    {
      name: 'location',
      label: 'Airport Location',
      type: 'group',
      fields: [
        {
          name: 'address',
          label: 'Full Address',
          type: 'textarea',
          required: true,
          localized: true,
        },
        {
          name: 'googleMapsURL',
          label: 'Google Maps Link',
          type: 'text',
          validate: (value: string | string[] | null | undefined) =>
            validateURL(Array.isArray(value) ? value[0] : value),
          admin: {
            description: 'Full Google Maps URL for the airport location.',
            placeholder: 'https://maps.google.com/...',
          },
        },
        {
          name: 'mapEmbedURL',
          label: 'Map Embed URL',
          type: 'text',
          validate: validateMapEmbedURL,
          admin: {
            description: 'Google Maps or OpenStreetMap embed src URL for the iframe.',
            placeholder: 'https://www.google.com/maps/embed?...',
          },
        },
        {
          name: 'coordinates',
          label: 'GPS Coordinates',
          type: 'group',
          fields: [
            { name: 'latitude',  label: 'Latitude',  type: 'number', admin: { placeholder: '-19.7577' } },
            { name: 'longitude', label: 'Longitude', type: 'number', admin: { placeholder: '63.3610' } },
          ],
        },
      ],
    },
    {
      name: 'gettingHere',
      label: 'Getting to the Airport',
      type: 'array',
      fields: [
        {
          name: 'transportMode',
          label: 'Transport Mode',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          localized: true,
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      enforceApproverOnPublish('Only approvers can publish working hours and directions.'),
    ],
  },
}
