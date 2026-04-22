import type { Field, RichTextFieldValidation } from 'payload'

const MAX_SECTION_BODY_CHARS = 5000

function getLexicalTextLength(value: unknown): number {
  if (!value || typeof value !== 'object') return 0

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + getLexicalTextLength(item), 0)
  }

  return Object.entries(value).reduce((total, [key, item]) => {
    if (key === 'text' && typeof item === 'string') return total + item.length
    return total + getLexicalTextLength(item)
  }, 0)
}

const validateSectionBodyLength: RichTextFieldValidation = (value) => {
  const length = getLexicalTextLength(value)

  if (length > MAX_SECTION_BODY_CHARS) {
    return `Section body must be ${MAX_SECTION_BODY_CHARS} characters or fewer.`
  }

  return true
}

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
        maxLength: 200,
      },
      {
        name: 'body',
        type: 'richText',
        required: true,
        validate: validateSectionBodyLength,
        admin: {
          description: `Keep section body content to ${MAX_SECTION_BODY_CHARS} characters or fewer.`,
        },
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
