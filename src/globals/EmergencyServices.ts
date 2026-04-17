// =============================================================================
// Emergency Services Global
//
// Airport emergency contact information and procedures.
//
// CRITICAL CONTENT GOVERNANCE RULES:
// - All emergency contact numbers MUST be verified with airport management
//   before publishing.
// - This content requires Approver-level or Admin sign-off before going live.
// - Do NOT publish unverified emergency numbers.
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isApprover } from '@/access'

export const EmergencyServices: GlobalConfig = {
  slug: 'emergency-services',
  access: {
    read:   () => true,
    update: isApprover, // Emergency content requires elevated access to edit
  },
  admin: {
    group: 'Site Pages',
    description: 'CRITICAL: All emergency numbers must be verified before publishing.',
  },
  versions: {
    drafts: true,
    max: 30,
  },
  fields: [
    {
      name: 'pageTitle',
      label: 'Page Title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Emergency Services',
    },
    {
      name: 'introduction',
      label: 'Introduction',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'primaryEmergencyNumber',
      label: 'Primary Emergency Number',
      type: 'text',
      required: true,
      admin: {
        description: 'The single most important emergency contact (e.g. 999). Displayed prominently.',
        placeholder: '999',
      },
    },
    {
      name: 'serviceContacts',
      label: 'Emergency Service Contacts',
      type: 'array',
      fields: [
        {
          name: 'serviceName',
          label: 'Service Name',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'text',
          required: true,
          validate: (value: string | null | undefined) => {
            if (!value) return 'Phone number is required.'
            if (!/^\+?[\d\s\-()]{7,20}$/.test(value.trim())) {
              return 'Enter a valid phone number (e.g. +230 831 xxxx).'
            }
            return true
          },
          admin: { placeholder: '+230 831 xxxx' },
        },
        {
          name: 'description',
          label: 'Description / When to call',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'available24h',
          label: '24/7 Availability',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'medicalFacilities',
      label: 'Medical Facilities at the Airport',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'evacuationProcedures',
      label: 'Passenger Evacuation / Emergency Procedures',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'High-level passenger guidance only. Detailed operational procedures are internal.',
      },
    },
    {
      name: 'lastVerifiedDate',
      label: 'Last Verified Date',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Date emergency contacts were last verified with the airport authority.',
      },
    },
    {
      name: 'verifiedBy',
      label: 'Verified By',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Name/role of the person who verified these contacts.',
      },
    },
  ],
}
