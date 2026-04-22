// =============================================================================
// Usage Fees Global
//
// Airport usage, passenger, and service charges.
//
// CRITICAL: Do NOT hardcode live fee amounts here.
// Fee schedules must be approved by airport management and uploaded as
// official PDF documents. This global provides the editorial context
// and links to the official fee schedule PDF in the protected docs bucket.
//
// Fee amounts shown in the admin UI are for editorial context only and
// MUST be sourced from the official, approved fee schedule document.
// =============================================================================

import type { GlobalConfig } from 'payload'

import { isEditor } from '@/access'
import { validatePhone } from '@/fields/validators'
import { enforceApproverOnPublish } from './approvalGuards'

export const UsageFees: GlobalConfig = {
  slug: 'usage-fees',
  access: {
    read:   () => true,
    update: isEditor,
  },
  admin: {
    group: 'Site Pages',
    description: 'Airport usage charges, fee categories, and links to approved fee schedule PDFs.',
  },
  versions: {
    drafts: true,
    max: 20,
  },
  fields: [
    {
      name: 'pageTitle',
      label: 'Page Title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Airport Usage Fees',
    },
    {
      name: 'introduction',
      label: 'Introduction',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'General introduction to the fee structure. Do not include specific amounts without linking the official schedule.',
      },
    },
    {
      name: 'feeCategories',
      label: 'Fee Categories',
      type: 'array',
      fields: [
        {
          name: 'categoryName',
          label: 'Category Name',
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
        {
          name: 'noteOnSource',
          label: 'Source Note',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'e.g. "Refer to the official fee schedule for current rates."',
          },
        },
        {
          name: 'officialSchedulePDF',
          label: 'Official Fee Schedule PDF',
          type: 'upload',
          relationTo: 'documents',
          admin: {
            description: 'Link the approved fee schedule PDF from the protected docs bucket.',
          },
        },
        {
          name: 'effectiveFrom',
          label: 'Effective From',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayOnly' },
          },
        },
      ],
    },
    {
      name: 'paymentMethods',
      label: 'Accepted Payment Methods',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'contactForEnquiries',
      label: 'Contact for Enquiries',
      type: 'group',
      fields: [
        { name: 'name',  label: 'Contact Name / Department', type: 'text' },
        { name: 'phone', label: 'Phone',                     type: 'text', validate: validatePhone, admin: { placeholder: '+230 831 xxxx' } },
        { name: 'email', label: 'Email',                     type: 'email', admin: { placeholder: 'fees@arl.aero' } },
      ],
    },
    {
      name: 'lastApprovedDate',
      label: 'Last Approved / Updated',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Date fee information was last reviewed and approved by management.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      enforceApproverOnPublish('Only approvers can publish usage fees.'),
    ],
  },
}
