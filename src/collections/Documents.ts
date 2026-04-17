// =============================================================================
// Documents Collection
//
// Handles protected PDF uploads: communiqués, regulations, guidance docs,
// fee schedules, and general official documents.
//
// Storage: Supabase Storage (arl-protected-docs bucket) via @payloadcms/storage-s3
// Access:  Private bucket. Public URLs are NOT available.
//          Consumers must request signed URLs server-side via getSignedURL().
//
// RATIONALE FOR SEPARATE COLLECTION:
//   Keeping documents separate from media allows:
//   - Different S3 plugin bucket routing per collection
//   - Tighter access control (editors only, no public read)
//   - Clear distinction in admin between image assets and official documents
// =============================================================================

import type { CollectionConfig } from 'payload'

import { isAdmin, isEditor } from '@/access'

export const Documents: CollectionConfig = {
  slug: 'documents',
  access: {
    // Documents are NOT publicly readable through the API.
    // Signed URLs are generated server-side in Server Components.
    read:   isEditor,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle:     'title',
    defaultColumns: ['title', 'documentType', 'updatedAt'],
    description:    'Protected PDFs stored in the private Supabase bucket. Access requires server-generated signed URLs.',
    group:          'Assets',
  },
  upload: {
    // @payloadcms/storage-s3 routes this collection to arl-protected-docs bucket
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'title',
      label: 'Document Title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Brief description of what this document contains.',
      },
    },
    {
      name: 'documentType',
      label: 'Document Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Communiqué / Notice PDF',  value: 'communique'   },
        { label: 'Passenger Guidance',        value: 'guidance'     },
        { label: 'Airport Regulation',        value: 'regulation'   },
        { label: 'Fee Schedule',              value: 'fee_schedule' },
        { label: 'General Document',          value: 'general'      },
      ],
      admin: {
        description: 'Controls the storage prefix and determines who can access this document.',
      },
    },
    {
      name: 'effectiveDate',
      label: 'Effective Date',
      type: 'date',
      admin: {
        description: 'The date this document comes into effect (optional).',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'expiryDate',
      label: 'Expiry / Superseded Date',
      type: 'date',
      admin: {
        description: 'Leave blank if this document does not expire.',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive documents are hidden from the frontend but retained for audit purposes.',
      },
    },
    // Immutable audit fields — set by hook on first create
    {
      name: 'uploadedAt',
      label: 'Uploaded At',
      type: 'date',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly:  true,
        position:  'sidebar',
        condition: (data) => Boolean(data?.uploadedAt),
      },
    },
    {
      name: 'uploadedBy',
      label: 'Uploaded By',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly:  true,
        position:  'sidebar',
        condition: (data) => Boolean(data?.uploadedBy),
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create') {
          data.uploadedAt = new Date().toISOString()
          if (req.user?.id) {
            data.uploadedBy = req.user.id
          }
        }
        return data
      },
    ],
  },
}
