import { describe, expect, it } from 'vitest'

import { FAQs } from '@/collections/FAQs'

function buildAccessArgs(roles: string[]) {
  return {
    req: {
      user: {
        roles,
      },
    },
  } as any
}

describe('FAQs collection', () => {
  it('defaults new FAQs to draft status', () => {
    const rowField = FAQs.fields.find((field) => 'fields' in field)
    const statusField = rowField?.fields.find(
      (field) => 'name' in field && field.name === 'status',
    )

    expect(statusField).toMatchObject({ defaultValue: 'draft' })
  })

  it('limits FAQ deletion to admins', () => {
    expect(FAQs.access?.delete?.(buildAccessArgs(['approver']))).toBe(false)
    expect(FAQs.access?.delete?.(buildAccessArgs(['content_admin']))).toBe(true)
  })
})
