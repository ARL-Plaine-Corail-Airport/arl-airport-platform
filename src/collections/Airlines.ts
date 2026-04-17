// =============================================================================
// Airlines Collection
//
// Stores airline profiles operating at Rodrigues / Plaine Corail Airport.
// Content is managed by admins — this is NOT a live feed from an airline API.
// =============================================================================

import type { CollectionConfig, TextFieldValidation } from 'payload'

import { isAdmin, isEditor, publishedOrAdmin } from '@/access'

const AIRLINE_WEBSITE_PROTOCOLS = new Set(['http:', 'https:'])
const AIRLINE_CONTACT_PHONE_PATTERN = /^\+?[0-9()\-\s]+$/
const AIRLINE_IATA_CODE_PATTERN = /^[A-Z0-9]{2}$/
const AIRLINE_ICAO_CODE_PATTERN = /^[A-Z]{3,4}$/

const validateAirlineWebsite: TextFieldValidation = (value) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return true
  }

  try {
    const url = new URL(trimmedValue)

    if (!AIRLINE_WEBSITE_PROTOCOLS.has(url.protocol)) {
      return 'Official Website must start with http:// or https://.'
    }

    return true
  } catch {
    return 'Official Website must be a valid full URL starting with http:// or https://.'
  }
}

const validateAirlineContactPhone: TextFieldValidation = (value) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return true
  }

  if (!AIRLINE_CONTACT_PHONE_PATTERN.test(trimmedValue)) {
    return 'Reservation / Contact Phone can only include an optional leading +, digits, spaces, dashes, and parentheses.'
  }

  if (!/\d/.test(trimmedValue)) {
    return 'Reservation / Contact Phone must include at least one digit.'
  }

  return true
}

const validateAirlineIataCode: TextFieldValidation = (value) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return true
  }

  if (!AIRLINE_IATA_CODE_PATTERN.test(trimmedValue)) {
    return 'IATA code must be exactly 2 uppercase alphanumeric characters.'
  }

  return true
}

const validateAirlineIcaoCode: TextFieldValidation = (value) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return true
  }

  if (!AIRLINE_ICAO_CODE_PATTERN.test(trimmedValue)) {
    return 'ICAO code must be 3-4 uppercase letters.'
  }

  return true
}

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
                  validate: validateAirlineIataCode,
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
                  validate: validateAirlineIcaoCode,
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
                  validate: validateAirlineWebsite,
                  admin: {
                    width: '50%',
                    description: 'Full URL starting with http:// or https://',
                    placeholder: 'https://www.airmauritius.com',
                  },
                },
                {
                  name: 'contactPhone',
                  label: 'Reservation / Contact Phone',
                  type: 'text',
                  validate: validateAirlineContactPhone,
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
