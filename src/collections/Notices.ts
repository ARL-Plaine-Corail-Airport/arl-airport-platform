import type { CollectionConfig, FieldAccess } from 'payload'

import { isAdmin, isApprover, isEditor, publishedVersionOrAdmin } from '@/access'
import { autoSlug } from '@/hooks/autoSlug'
import { syncWorkflowStatus } from './workflowStatus'

type NoticeExpirySiblingData = {
  publishedAt?: string | Date | null
}

function hasNoticePublishedAt(siblingData: unknown): siblingData is NoticeExpirySiblingData {
  return typeof siblingData === 'object' && siblingData !== null && 'publishedAt' in siblingData
}

const syncNoticeStatus = syncWorkflowStatus({
  collection: 'notices',
  requiredStatusForPublish: 'approved',
  publishedStatus: 'published',
  approvalStatus: 'approved',
  publishError: 'Set status to Approved before publishing this notice.',
  requireApproverToPublish: true,
  setPublishedAt: true,
  setLastApprovedBy: true,
})

const restrictedEditorNoticeStatuses = new Set(['approved', 'published', 'expired', 'archived'])

const canSetNoticeStatus: FieldAccess = ({ data, req, siblingData }) => {
  if (isApprover({ req })) return true

  const status = (siblingData as { status?: unknown } | undefined)?.status
    ?? (data as { status?: unknown } | undefined)?.status

  return typeof status !== 'string' || !restrictedEditorNoticeStatuses.has(status)
}

const canSetNoticeBanner: FieldAccess = ({ data, req, siblingData }) => {
  if (isApprover({ req })) return true

  const promoteToBanner = (siblingData as { promoteToBanner?: unknown } | undefined)
    ?.promoteToBanner
    ?? (data as { promoteToBanner?: unknown } | undefined)?.promoteToBanner

  return promoteToBanner !== true
}

export const Notices: CollectionConfig = {
  slug: 'notices',
  access: {
    read: publishedVersionOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'urgent', 'updatedAt'],
    group: 'Content',
    description: 'Airport notices, alerts, and announcements.',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ── Tab 1: Content ────────────────────────────────────────────────
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              admin: {
                description: 'Short, clear title shown to passengers.',
                placeholder: 'e.g. Runway Maintenance — March 2026',
              },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              maxLength: 120,
              admin: {
                description: 'Auto-generated from title if left blank. You can override with a custom slug.',
                placeholder: 'runway-closure-2025',
              },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              localized: true,
              admin: {
                description: 'One or two sentences shown in notice listings and push notifications.',
              },
            },
            {
              name: 'body',
              type: 'richText',
              required: true,
              localized: true,
              admin: {
                description: 'Full notice body shown on the detail page.',
              },
            },
          ],
        },

        // ── Tab 2: Publishing ─────────────────────────────────────────────
        {
          label: 'Publishing',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  type: 'select',
                  required: true,
                  defaultValue: 'operational',
                  index: true,
                  admin: { width: '50%' },
                  options: [
                    { label: 'Operational', value: 'operational' },
                    { label: 'Passenger Information', value: 'passenger_info' },
                    { label: 'Regulation', value: 'regulation' },
                    { label: 'Fee / Charge', value: 'fee' },
                    { label: 'Emergency', value: 'emergency' },
                    { label: 'Corporate', value: 'corporate' },
                  ],
                },
                {
                  name: 'status',
                  type: 'select',
                  required: true,
                  defaultValue: 'draft',
                  index: true,
                  access: {
                    create: canSetNoticeStatus,
                    update: canSetNoticeStatus,
                  },
                  admin: { width: '50%' },
                  options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'In Review', value: 'in_review' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Published', value: 'published' },
                    { label: 'Expired', value: 'expired' },
                    { label: 'Archived', value: 'archived' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'publishedAt',
                  type: 'date',
                  access: {
                    update: canSetNoticeStatus,
                  },
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime' },
                    description: 'Leave blank to auto-set when status is changed to Published.',
                  },
                },
                {
                  name: 'expiresAt',
                  type: 'date',
                  access: {
                    update: canSetNoticeStatus,
                  },
                  validate: (value, { siblingData }) => {
                    if (value && hasNoticePublishedAt(siblingData) && siblingData.publishedAt) {
                      const expiresAt = new Date(value)
                      const publishedAt = new Date(siblingData.publishedAt)

                      if (
                        !Number.isNaN(expiresAt.getTime()) &&
                        !Number.isNaN(publishedAt.getTime()) &&
                        expiresAt <= publishedAt
                      ) {
                        return 'Expiry date must be after publish date'
                      }
                    }

                    return true
                  },
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime' },
                    description: 'Optional. Notice will be marked Expired after this date.',
                    condition: (data) => data?.status === 'published',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'urgent',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    width: '33%',
                    description: 'Highlights this notice with a warning indicator.',
                  },
                },
                {
                  name: 'pinned',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    width: '33%',
                    description: 'Keeps this notice at the top of listings.',
                  },
                },
                {
                  name: 'promoteToBanner',
                  type: 'checkbox',
                  defaultValue: false,
                  access: {
                    create: canSetNoticeBanner,
                    update: canSetNoticeBanner,
                  },
                  admin: {
                    width: '34%',
                    description: 'Surface in the site-wide alert banner (urgent + published only).',
                    condition: (data) => data?.urgent === true && data?.status === 'published',
                  },
                },
              ],
            },
          ],
        },

        // ── Tab 3: SEO ────────────────────────────────────────────────────
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              label: 'SEO',
              type: 'group',
              fields: [
                {
                  name: 'metaTitle',
                  label: 'Meta Title',
                  type: 'text',
                  localized: true,
                  admin: { placeholder: 'Custom title for search engines' },
                },
                {
                  name: 'metaDescription',
                  label: 'Meta Description',
                  type: 'textarea',
                  localized: true,
                  admin: { placeholder: 'Brief description for search results (150-160 chars)' },
                },
              ],
            },
          ],
        },

        // ── Tab 4: Media & Approval ───────────────────────────────────────
        {
          label: 'Media & Approval',
          fields: [
            {
              name: 'attachments',
              type: 'relationship',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: 'Optional images attached to this notice.',
              },
            },
            {
              name: 'lastApprovedBy',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                description: 'Auto-populated when status is set to Approved.',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [autoSlug('title')],
    beforeChange: [syncNoticeStatus],
  },
}
