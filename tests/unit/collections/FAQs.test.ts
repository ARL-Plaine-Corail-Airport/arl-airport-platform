import { describe, expect, it } from 'vitest'

import { FAQs } from '@/collections/FAQs'

describe('FAQs collection', () => {
  it('defaults new FAQs to draft status', () => {
    const rowField = FAQs.fields.find((field) => 'fields' in field)
    const statusField = rowField?.fields.find(
      (field) => 'name' in field && field.name === 'status',
    )

    expect(statusField).toMatchObject({ defaultValue: 'draft' })
  })
})
