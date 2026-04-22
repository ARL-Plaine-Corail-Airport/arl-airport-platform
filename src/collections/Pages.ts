import type { CollectionConfig, Field, FieldAccess } from 'payload'

import { isAdmin, isApprover, isEditor, publishedVersionOrAdmin } from '@/access'
import { sectionFields } from '@/fields/sectionFields'
import { autoSlug } from '@/hooks/autoSlug'
import { syncWorkflowStatus } from './workflowStatus'

const canSetPageStatus: FieldAccess = ({ data, req, siblingData }) => {
  if (isApprover({ req })) return true

  const status = (siblingData as { status?: unknown } | undefined)?.status
    ?? (data as { status?: unknown } | undefined)?.status

  return status !== 'published'
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: publishedVersionOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'Content',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 120,
      admin: {
        description: 'Auto-generated from title if left blank. Used in the URL: /[slug]',
        placeholder: 'about-the-airport',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'pageImage',
      label: 'Page Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional image displayed near the top of this page on the public site.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      index: true,
      access: {
        create: canSetPageStatus,
        update: canSetPageStatus,
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Published', value: 'published' },
      ],
    },
    ...sectionFields,
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
          admin: { placeholder: 'Custom page title for search engines' },
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
  ] satisfies Field[],
  hooks: {
    beforeValidate: [autoSlug('title')],
    beforeChange: [
      syncWorkflowStatus({
        collection: 'pages',
        requiredStatusForPublish: 'in_review',
        publishedStatus: 'published',
        publishError: 'Only approvers can publish pages after review.',
        requireApproverToPublish: true,
        setPublishedAt: true,
      }),
    ],
  },
}
