// =============================================================================
// Airport Project Collection
//
// Updates, notices, and documents related to the Rodrigues Airport Project
// (new runway, associated facilities, tender documents, press releases).
// =============================================================================

import type { CollectionConfig } from 'payload'

import { isAdmin, isEditor, publishedOrAdmin } from '@/access'
import { autoSlug } from '@/hooks/autoSlug'

export const AirportProject: CollectionConfig = {
  slug: 'airport-project',
  access: {
    read:   publishedOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle:     'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt', 'updatedAt'],
    description:    'Airport project updates, tender documents, and press releases.',
    group:          'Content',
  },
  versions: {
    drafts: {
      autosave: { interval: 60000 },
    },
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      label: 'URL Slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Auto-generated from title if left blank. Used in the URL: /airport-project/[slug]',
        placeholder: 'addendum-no-04-extension-of-bids',
      },
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { label: 'Notice to Bidders',     value: 'notice_to_bidders'  },
        { label: 'Press Release',         value: 'press_release'      },
        { label: 'Site Visit',            value: 'site_visit'         },
        { label: 'Environmental / Social', value: 'environmental'     },
        { label: 'General Update',        value: 'general'            },
      ],
    },
    {
      name: 'summary',
      label: 'Summary / Description',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Description shown on the listing page.',
      },
    },
    {
      name: 'body',
      label: 'Full Content',
      type: 'richText',
      localized: true,
    },
    {
      name: 'featuredImage',
      label: 'Featured Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Thumbnail shown on the listing page.',
      },
    },
    // Downloadable documents
    {
      name: 'attachments',
      label: 'Attachments / Documents',
      type: 'array',
      admin: {
        description: 'Downloadable files (PDFs, tender documents, photos, etc.).',
      },
      fields: [
        {
          name: 'label',
          label: 'Link Label',
          type: 'text',
          required: true,
          localized: true,
          admin: { placeholder: 'Download/View the document' },
        },
        {
          name: 'file',
          label: 'File',
          type: 'upload',
          relationTo: 'documents',
          required: true,
        },
      ],
    },
    // Publishing workflow
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft',     value: 'draft'     },
        { label: 'In Review', value: 'in_review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived',  value: 'archived'  },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      label: 'Published At',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.publishedAt),
      },
    },
    {
      name: 'isPinned',
      label: 'Pinned',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status === 'published',
      },
    },
    // SEO
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
  hooks: {
    beforeValidate: [autoSlug('title')],
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // Sync custom status with Payload's draft system:
          // When the "Publish" button is clicked, _status becomes 'published'
          if (data._status === 'published' && data.status !== 'published') {
            data.status = 'published'
          }
          if (data._status === 'draft' && data.status === 'published') {
            data.status = 'draft'
          }
          if (data.status === 'published' && !data.publishedAt) {
            data.publishedAt = new Date().toISOString()
          }
        }
        return data
      },
    ],
  },
}
