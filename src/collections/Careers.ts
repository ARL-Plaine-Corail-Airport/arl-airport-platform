// =============================================================================
// Career Notices Collection
//
// Public career opportunities with protected PDF attachments managed in Payload.
// =============================================================================

import type { CollectionConfig } from 'payload'

import { canSetPublishedStatus, isAdmin, isEditor, publishedVersionOrAdmin } from '@/access'
import { autoSlug } from '@/hooks/autoSlug'
import { syncWorkflowStatus } from './workflowStatus'

export const Careers: CollectionConfig = {
  slug: 'careers',
  labels: {
    singular: 'Career Notice',
    plural: 'Career Notices',
  },
  access: {
    read: publishedVersionOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
    description: 'Career opportunities and vacancy notices with downloadable PDF documents.',
    group: 'Content',
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
      maxLength: 120,
      admin: {
        description: 'Auto-generated from title if left blank. Used as a stable career notice identifier.',
        placeholder: 'full-time-safety-health-officer',
      },
    },
    {
      name: 'summary',
      label: 'Summary / Description',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Description shown on the public Career listing page.',
      },
    },
    {
      name: 'attachments',
      label: 'Attachments / Documents',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Upload the official vacancy PDF through the Documents collection.',
      },
      fields: [
        {
          name: 'label',
          label: 'Link Label',
          type: 'text',
          required: true,
          localized: true,
          admin: { placeholder: 'Click here to view more details >' },
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
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      access: {
        create: canSetPublishedStatus,
        update: canSetPublishedStatus,
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
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
      name: 'lastApprovedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Auto-populated when an approver publishes from In Review.',
        readOnly: true,
        position: 'sidebar',
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
      syncWorkflowStatus({
        collection: 'careers',
        requiredStatusForPublish: 'in_review',
        publishedStatus: 'published',
        publishError: 'Only approvers can publish career notices after review.',
        requireApproverToPublish: true,
        setPublishedAt: true,
        setLastApprovedBy: true,
      }),
    ],
  },
}
