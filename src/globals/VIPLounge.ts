// =============================================================================
// VIP Lounge Global
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'
import { validatePhone } from '@/fields/validators'
import { enforceApproverOnPublish } from './approvalGuards'

export const VIPLounge: GlobalConfig = {
  slug: 'vip-lounge',
  access: {
    read:   () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'VIP lounge amenities, eligibility, booking details, and operating hours.',
  },
  versions: {
    drafts: true,
    max: 10,
  },
  fields: [
    {
      name: 'pageTitle',
      label: 'Page Title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'VIP Lounge',
    },
    {
      name: 'introduction',
      label: 'Introduction',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'amenities',
      label: 'Lounge Amenities',
      type: 'array',
      fields: [
        {
          name: 'item',
          label: 'Amenity',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'eligibility',
      label: 'Eligibility Criteria',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'bookingInformation',
      label: 'Booking Information',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'operatingHours',
      label: 'Operating Hours',
      type: 'text',
      localized: true,
      admin: { placeholder: '06:00 — 22:00 daily' },
    },
    {
      name: 'contactPhone',
      label: 'Contact Phone',
      type: 'text',
      validate: validatePhone,
      admin: { placeholder: '+230 831 xxxx' },
    },
    {
      name: 'contactEmail',
      label: 'Contact Email',
      type: 'email',
      admin: { placeholder: 'vip@arl.aero' },
    },
    {
      name: 'loungeImages',
      label: 'Lounge Images',
      type: 'array',
      fields: [
        {
          name: 'image',
          label: 'Image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Displayed in the public VIP Lounge gallery.',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      enforceApproverOnPublish('Only approvers can publish VIP lounge content.'),
    ],
  },
}
