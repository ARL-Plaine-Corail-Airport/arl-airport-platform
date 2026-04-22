import type { CollectionConfig, TextFieldValidation } from 'payload'

import { isEditor, isApprover } from '@/access'

const AIRLINE_CODE_PATTERN = /^[A-Z0-9]{2,3}$/

const validateAirlineCode: TextFieldValidation = (value) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return 'Airline code is required.'
  }

  if (!AIRLINE_CODE_PATTERN.test(trimmedValue)) {
    return 'Airline code must be 2 to 3 uppercase letters or digits.'
  }

  return true
}

export const Flights: CollectionConfig = {
  slug: 'flights',
  access: {
    read: ({ req }) => {
      if (isEditor({ req })) return true
      return { status: { equals: 'active' } }
    },
    create: isEditor,
    update: isEditor,
    delete: isApprover,
  },
  admin: {
    useAsTitle: 'flightNumber',
    defaultColumns: ['flightNumber', 'boardType', 'airline', 'route', 'scheduledTime', 'status', 'source'],
    group: 'Content',
    description:
      'Manual flight entries. Use this to add flights missing from the AirLabs feed or to override incorrect API data. Entries matching an API flight number will replace the API version.',
  },
  versions: {
    drafts: false,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'boardType',
          type: 'select',
          required: true,
          defaultValue: 'arrival',
          admin: { width: '50%' },
          options: [
            { label: 'Arrival', value: 'arrival' },
            { label: 'Departure', value: 'departure' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'active',
          admin: { width: '50%' },
          options: [
            { label: 'Active (visible)', value: 'active' },
            { label: 'Hidden', value: 'hidden' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'airline',
          type: 'text',
          required: true,
          maxLength: 3,
          validate: validateAirlineCode,
          admin: {
            width: '50%',
            placeholder: 'MK',
            description: 'Airline code using 2 to 3 uppercase letters or digits (e.g. MK).',
          },
        },
        {
          name: 'flightNumber',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            placeholder: 'MK140',
            description: 'Full flight number. If this matches an API flight, the manual entry takes priority.',
          },
        },
      ],
    },
    {
      name: 'route',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'MRU',
        description: 'Origin IATA code for arrivals, destination IATA code for departures.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'scheduledTime',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Scheduled arrival/departure time.',
          },
        },
        {
          name: 'estimatedTime',
          type: 'date',
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Leave blank if on time. Set to show a delay or early arrival.',
          },
        },
      ],
    },
    {
      name: 'remarks',
      type: 'select',
      required: true,
      defaultValue: 'Scheduled',
      options: [
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'On Time', value: 'On Time' },
        { label: 'Delayed', value: 'Delayed' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'Departed', value: 'Departed' },
        { label: 'En Route', value: 'En Route' },
        { label: 'Landed', value: 'Landed' },
        { label: 'Diverted', value: 'Diverted' },
        { label: 'Boarding', value: 'Boarding' },
      ],
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      admin: {
        readOnly: true,
        description: 'How this entry was created.',
      },
      options: [
        { label: 'Manual Entry', value: 'manual' },
        { label: 'API Override', value: 'override' },
      ],
    },
  ],
}
