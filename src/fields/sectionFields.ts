import type { Field } from 'payload'

export const sectionFields = [
  {
    name: 'sections',
    type: 'array',
    labels: {
      singular: 'Section',
      plural: 'Sections',
    },
    fields: [
      {
        name: 'heading',
        type: 'text',
        required: true,
      },
      {
        name: 'body',
        type: 'richText',
        required: true,
      },
      {
        name: 'bullets',
        type: 'array',
        labels: {
          singular: 'Bullet',
          plural: 'Bullets',
        },
        fields: [
          {
            name: 'text',
            type: 'text',
            required: true,
          },
        ],
      },
    ],
  },
] satisfies Field[]
