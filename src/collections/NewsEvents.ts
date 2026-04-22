// =============================================================================
// News & Events Collection
//
// Airport news articles and upcoming events.
// Follows the same draft → review → published workflow as Notices.
// =============================================================================

import type { CollectionConfig, FieldAccess } from 'payload'

import { isAdmin, isApprover, isEditor, publishedVersionOrAdmin } from '@/access'
import { autoSlug } from '@/hooks/autoSlug'
import { syncWorkflowStatus } from './workflowStatus'

const canSetNewsStatus: FieldAccess = ({ data, req, siblingData }) => {
  if (isApprover({ req })) return true

  const status = (siblingData as { status?: unknown } | undefined)?.status
    ?? (data as { status?: unknown } | undefined)?.status

  return status !== 'published'
}

export const NewsEvents: CollectionConfig = {
  slug: 'news-events',
  access: {
    read:   publishedVersionOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle:     'title',
    defaultColumns: ['title', 'type', 'status', 'publishedAt', 'updatedAt'],
    description:    'Airport news articles and event announcements.',
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
      maxLength: 120,
      admin: {
        description: 'Auto-generated from title if left blank. Used in the URL: /news-events/[slug]',
        placeholder: 'annual-open-day-2026',
      },
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { label: 'News Article',    value: 'news'      },
        { label: 'Event',           value: 'event'     },
        { label: 'Press Release',   value: 'press'     },
        { label: 'Announcement',    value: 'announcement' },
      ],
    },
    {
      name: 'summary',
      label: 'Summary / Excerpt',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Short summary for listing pages and meta description (160 chars recommended).',
      },
    },
    {
      name: 'body',
      label: 'Body Content',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'featuredImage',
      label: 'Featured Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Shown on the public news listing and the individual article page.',
      },
    },
    // Event-specific fields (visible when type === 'event')
    {
      name: 'eventDetails',
      label: 'Event Details',
      type: 'group',
      admin: {
        condition: (data) => data?.type === 'event',
      },
      fields: [
        {
          name: 'startDate',
          label: 'Start Date & Time',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        {
          name: 'endDate',
          label: 'End Date & Time',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        {
          name: 'location',
          label: 'Location',
          type: 'text',
          localized: true,
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
        { label: 'Draft',       value: 'draft'     },
        { label: 'In Review',   value: 'in_review' },
        { label: 'Published',   value: 'published' },
        { label: 'Archived',    value: 'archived'  },
      ],
      access: {
        create: canSetNewsStatus,
        update: canSetNewsStatus,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      label: 'Published At',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly:  true,
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
      label: 'Pinned (Featured)',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status === 'published',
      },
    },
    // Attachments / downloadable documents
    {
      name: 'attachments',
      label: 'Attachments',
      type: 'array',
      admin: {
        description: 'Downloadable documents displayed as links on the news item.',
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
      syncWorkflowStatus({
        collection: 'news-events',
        requiredStatusForPublish: 'in_review',
        publishedStatus: 'published',
        publishError: 'Only approvers can publish news/events after review.',
        requireApproverToPublish: true,
        setPublishedAt: true,
        setLastApprovedBy: true,
      }),
    ],
  },
}
