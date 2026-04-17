import { randomUUID } from 'node:crypto'

import type { CollectionBeforeValidateHook } from 'payload'

function toSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Auto-generates a URL slug from a title field when the slug is left empty.
 */
export function autoSlug(titleField = 'title'): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data) return data
    const titleValue = typeof data[titleField] === 'string' ? data[titleField] : ''
    if (!data.slug && titleValue) {
      const slug = toSlug(titleValue)
      if (slug) {
        data.slug = slug
        return data
      }

      const uuid = randomUUID()
      const uuidPrefix = uuid.split('-')[0] || uuid.replace(/-/g, '').slice(0, 8)
      data.slug = `item-${uuidPrefix || Date.now().toString(36)}`
    }
    return data
  }
}
