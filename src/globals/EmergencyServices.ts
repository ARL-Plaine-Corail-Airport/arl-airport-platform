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

import { isApprover, isEditor } from '@/access'
import { validatePhone } from '@/fields/validators'

function enforceEmergencyPublishReview({ data, originalDoc, req }: {
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  req: Parameters<typeof isApprover>[0]['req']
}) {
  const nextStatus = data.status ?? originalDoc?.status
  const previousStatus = originalDoc?.status
  const isPublishingVersion = data._status === 'published'

  if (isPublishingVersion && nextStatus !== 'published') {
    throw new Error('Set emergency services workflow status to Published before publishing.')
  }

  if (
    (isPublishingVersion || nextStatus === 'published') &&
    previousStatus !== 'published' &&
    !isApprover({ req })
  ) {
    throw new Error('Emergency services must be approved before publishing.')
  }

  return data
}

export const EmergencyServices: GlobalConfig = {
  slug: 'emergency-services',
  access: {
    read:   () => true,
    update: isEditor,
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
      name: 'status',
      label: 'Workflow Status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Only approvers and admins may transition emergency contacts to Published.',
      },
    },
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
      validate: validatePhone,
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
          validate: validatePhone,
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
      access: {
        read: ({ req }) => isEditor({ req }),
      },
      admin: {
        position: 'sidebar',
        description: 'Name/role of the person who verified these contacts.',
      },
    },
  ],
  hooks: {
    beforeChange: [enforceEmergencyPublishReview],
  },
}
