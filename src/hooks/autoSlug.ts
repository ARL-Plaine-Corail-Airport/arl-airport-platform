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
    if (!data.slug && data[titleField]) {
      data.slug = toSlug(data[titleField])
    }
    return data
  }
}
