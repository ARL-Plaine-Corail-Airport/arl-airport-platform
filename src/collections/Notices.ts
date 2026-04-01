import type { CollectionConfig } from 'payload'

import { isApprover, isEditor, publishedOrAdmin } from '@/access'
import { autoSlug } from '@/hooks/autoSlug'

export const Notices: CollectionConfig = {
  slug: 'notices',
  access: {
    read: publishedOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isApprover,
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
                  defaultValue: 'operational',
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
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime' },
                    description: 'Leave blank to auto-set when status is changed to Published.',
                  },
                },
                {
                  name: 'expiresAt',
                  type: 'date',
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
                description: 'Optional images or documents attached to this notice.',
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
    beforeChange: [
      ({ data, req, operation }: any) => {
        // Sync custom status with Payload's draft system
        if (data?._status === 'published' && data?.status === 'draft') {
          data.status = 'published'
        }
        if (data?._status === 'draft' && data?.status === 'published') {
          data.status = 'draft'
        }

        if (data?.status === 'published' && !data?.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }

        if (data?.status === 'approved' && req.user?.id) {
          data.lastApprovedBy = req.user.id
        }

        return data
      },
    ],
  },
}
