import type { CollectionConfig, Field } from 'payload'

import { isApprover, isEditor, publishedOrAdmin } from '@/access'
import { sectionFields } from '@/fields/sectionFields'
import { autoSlug } from '@/hooks/autoSlug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: publishedOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isApprover,
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
      options: [
        { label: 'Draft', value: 'draft' },
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
      ({ data, operation }) => {
        if (operation === 'create' || operation === 'update') {
          if (data._status === 'published' && data.status === 'draft') {
            data.status = 'published'
          }
          if (data._status === 'draft' && data.status === 'published') {
            data.status = 'draft'
          }
        }
        return data
      },
    ],
  },
}
