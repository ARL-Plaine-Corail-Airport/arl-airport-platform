import type { CollectionConfig } from 'payload'

import { isAdmin, isEditor, publishedOrAdmin } from '@/access'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  access: {
    // Public read is intentional for published passenger FAQs.
    read: publishedOrAdmin,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'updatedAt'],
    group: 'Content',
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Write the question as a passenger would ask it.',
      },
    },
    {
      name: 'answer',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Clear, concise answer. Keep it under 200 words.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          defaultValue: 'general',
          admin: { width: '40%' },
          options: [
            { label: 'General', value: 'general' },
            { label: 'Flights', value: 'flights' },
            { label: 'Transport', value: 'transport' },
            { label: 'Accessibility', value: 'accessibility' },
            { label: 'Documents', value: 'documents' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'draft',
          admin: { width: '30%' },
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '30%',
            description: 'Lower = shown first.',
          },
        },
      ],
    },
  ],
}
