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

import type { CollectionConfig, Where } from 'payload'

import { isAdmin, isDocumentReader, isEditor, isSuperAdmin } from '@/access'
import { logger } from '@/lib/logger'
import { MAX_FILE_SIZES } from '@/lib/storage/buckets'
import { formatMegabytes, getUploadSize } from '@/lib/storage/upload-helpers'

const MAX_DOCUMENT_FILE_SIZE = MAX_FILE_SIZES.pdf
const PDF_EOF_SEARCH_BYTES = 64
const PDF_EOF_MARKER = Buffer.from('%%EOF')

const documentUploadConfig = {
  // @payloadcms/storage-s3 routes this collection to arl-protected-docs bucket
  mimeTypes: ['application/pdf'],
} as NonNullable<CollectionConfig['upload']>

type DocumentExpirySiblingData = {
  effectiveDate?: string | Date | null
}

function hasDocumentEffectiveDate(siblingData: unknown): siblingData is DocumentExpirySiblingData {
  return typeof siblingData === 'object' && siblingData !== null && 'effectiveDate' in siblingData
}

function isPDFUpload(
  file: unknown,
  { operation }: { operation: 'create' | 'update' },
): boolean {
  if (!file || typeof file !== 'object') return operation === 'update'

  const data = (file as { data?: unknown }).data
  if (!Buffer.isBuffer(data)) return false

  try {
    // Header: first 4 bytes must be "%PDF".
    if (data.subarray(0, 4).toString('utf8') !== '%PDF') return false

    // Trailer: "%%EOF" must appear within the last 64 bytes.
    const trailer = data.subarray(Math.max(0, data.length - PDF_EOF_SEARCH_BYTES))
    return trailer.includes(PDF_EOF_MARKER)
  } catch {
    return false
  }
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  access: {
    // Documents are NOT publicly readable through the API.
    // Signed URLs are generated server-side in Server Components.
    read: ({ req }) => {
      if (isSuperAdmin({ req })) return true
      if (!isDocumentReader({ req })) return false
      if (!req.user?.id) return false

      const where: Where = {
        or: [
          { visibility: { not_equals: 'restricted' } },
          { uploadedBy: { equals: req.user.id } },
        ],
      }

      return where
    },
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
  upload: documentUploadConfig,
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
      name: 'visibility',
      label: 'Visibility',
      type: 'select',
      required: true,
      defaultValue: 'internal',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Internal', value: 'internal' },
        { label: 'Restricted to Uploader', value: 'restricted' },
      ],
      admin: {
        description:
          'Restricted documents are readable only by their uploader unless the user is a super admin.',
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
      validate: (value, { siblingData }) => {
        if (value && hasDocumentEffectiveDate(siblingData) && siblingData.effectiveDate) {
          const expiryDate = new Date(value)
          const effectiveDate = new Date(siblingData.effectiveDate)

          if (
            !Number.isNaN(expiryDate.getTime()) &&
            !Number.isNaN(effectiveDate.getTime()) &&
            expiryDate <= effectiveDate
          ) {
            return 'Expiry date must be after the effective date'
          }
        }

        return true
      },
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
        const uploadSize = getUploadSize(req.file)
        if (uploadSize !== null && uploadSize > MAX_DOCUMENT_FILE_SIZE) {
          throw new Error(
            `Uploaded document exceeds the ${formatMegabytes(MAX_DOCUMENT_FILE_SIZE)} limit.`,
          )
        }

        if (!isPDFUpload(req.file, { operation })) {
          throw new Error('Uploaded document is not a valid PDF file.')
        }

        if (operation === 'create') {
          data.uploadedAt = new Date().toISOString()
          if (req.user?.id) {
            data.uploadedBy = req.user.id
          } else if (process.env.NODE_ENV === 'production') {
            // Restricted visibility relies on uploadedBy to grant owner access;
            // without a user id, a restricted doc would be unreadable by anyone
            // but super admins, so refuse the create outright.
            throw new Error('Documents must be created by an authenticated user.')
          } else {
            logger.warn(
              'Document created without authenticated user - uploadedBy not set',
              'Documents',
            )
          }
        }
        return data
      },
    ],
  },
}
