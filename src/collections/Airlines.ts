// =============================================================================
// Airlines Collection
//
// Stores airline profiles operating at Rodrigues / Plaine Corail Airport.
// Content is managed by admins — this is NOT a live feed from an airline API.
// =============================================================================

import type { CollectionConfig } from 'payload'

import { isAdmin, isEditor, publishedOrAdmin } from '@/access'

export const Airlines: CollectionConfig = {
  slug: 'airlines',
  access: {
    read:   publishedOrAdmin,
    create: isAdmin,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle:     'name',
    defaultColumns: ['name', 'iataCode', 'isActive', 'updatedAt'],
    description:    'Airlines operating at Rodrigues / Plaine Corail Airport.',
    group:          'Content',
  },
  versions: {
    drafts: true,
  },
  fields: [
    // ── Sidebar ──────────────────────────────────────────────────────────
    {
      name: 'isActive',
      label: 'Currently Operating',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck if this airline has suspended operations.',
      },
    },
    {
      name: 'displayOrder',
      label: 'Display Order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower number = displayed first.',
        condition: (data) => data?.isActive !== false,
      },
    },

    // ── Tabs ─────────────────────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
            {
              name: 'name',
              label: 'Airline Name',
              type: 'text',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'iataCode',
                  label: 'IATA Code',
                  type: 'text',
                  required: true,
                  maxLength: 2,
                  admin: {
                    width: '50%',
                    description: 'Two-letter designator (e.g. MK for Air Mauritius).',
                    placeholder: 'MK',
                  },
                },
                {
                  name: 'icaoCode',
                  label: 'ICAO Code',
                  type: 'text',
                  maxLength: 4,
                  admin: { width: '50%', placeholder: 'MAU' },
                },
              ],
            },
            {
              name: 'logo',
              label: 'Airline Logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'PNG/SVG with transparent background preferred.',
              },
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              localized: true,
            },
          ],
        },
        {
          label: 'Contact & Routes',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'website',
                  label: 'Official Website',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'Full URL including https://',
                    placeholder: 'https://www.airmauritius.com',
                  },
                },
                {
                  name: 'contactPhone',
                  label: 'Reservation / Contact Phone',
                  type: 'text',
                  admin: { width: '50%', placeholder: '+230 207 7070' },
                },
              ],
            },
            {
              name: 'destinations',
              label: 'Destinations from Rodrigues',
              type: 'array',
              fields: [
                {
                  name: 'city',
                  label: 'City',
                  type: 'text',
                  required: true,
                  localized: true,
                },
                {
                  name: 'airportCode',
                  label: 'Airport IATA Code',
                  type: 'text',
                  maxLength: 3,
                  admin: { placeholder: 'MRU' },
                },
                {
                  name: 'country',
                  label: 'Country',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
