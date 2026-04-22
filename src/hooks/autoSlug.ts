import { createHash, randomUUID } from 'node:crypto'

import type { CollectionBeforeValidateHook } from 'payload'

const LOCALIZED_TITLE_ORDER = ['en', 'fr', 'mfe'] as const
const MAX_SLUG_LENGTH = 120
const UNIQUE_SUFFIX_LENGTH = 8

function toSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function trimSlug(slug: string, maxLength = MAX_SLUG_LENGTH): string {
  const trimmed = slug.slice(0, maxLength).replace(/-+$/g, '')
  return trimmed || slug.slice(0, maxLength)
}

function getTitleValue(rawTitle: unknown): string {
  if (typeof rawTitle === 'string') return rawTitle

  if (!rawTitle || typeof rawTitle !== 'object') return ''

  const localizedTitle = rawTitle as Record<string, unknown>
  for (const locale of LOCALIZED_TITLE_ORDER) {
    const value = localizedTitle[locale]
    if (typeof value === 'string' && value.trim()) return value
  }

  const fallbackValue = Object.values(localizedTitle).find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  )

  return fallbackValue ?? ''
}

function getFallbackSlug() {
  const uuid = randomUUID()
  return `item-${uuid}`
}

async function ensureUniqueSlug(args: {
  collectionSlug?: string
  currentId?: string | number | null
  forceSuffix?: boolean
  req?: unknown
  slug: string
}) {
  if (args.forceSuffix) {
    return appendUniqueSuffix(args.slug)
  }

  const payload = args.req && typeof args.req === 'object'
    ? (args.req as { payload?: { find?: unknown } }).payload
    : undefined

  if (!payload || typeof payload.find !== 'function' || !args.collectionSlug) {
    return args.slug
  }

  const existing = await payload.find({
    collection: args.collectionSlug,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: args.slug } },
  })

  const existingId = existing?.docs?.[0]?.id
  if (!existingId || String(existingId) === String(args.currentId ?? '')) {
    return args.slug
  }

  return appendUniqueSuffix(args.slug)
}

function appendUniqueSuffix(slug: string): string {
  const suffixSource = `${slug}:${Date.now()}:${randomUUID()}`
  const suffix = createHash('sha256').update(suffixSource).digest('hex').slice(0, 8)
  const maxBaseLength = MAX_SLUG_LENGTH - UNIQUE_SUFFIX_LENGTH - 1
  return `${trimSlug(slug, maxBaseLength)}-${suffix}`
}

/**
 * Auto-generates a URL slug from a title field when the slug is left empty.
 */
export function autoSlug(titleField = 'title'): CollectionBeforeValidateHook {
  return async ({ collection, data, operation, originalDoc, req }) => {
    if (!data) return data
    const titleValue = getTitleValue(data[titleField])
    const forceCreateSuffix = operation === 'create' && Boolean(collection?.slug)

    // When there is no title, let the title's own required-validation fail; do not fabricate a slug.
    if (!data.slug && titleValue) {
      const slug = trimSlug(toSlug(titleValue))
      if (slug) {
        data.slug = await ensureUniqueSlug({
          collectionSlug: collection?.slug,
          currentId: data.id ?? originalDoc?.id,
          forceSuffix: forceCreateSuffix,
          req,
          slug,
        })
        return data
      }

      data.slug = await ensureUniqueSlug({
        collectionSlug: collection?.slug,
        currentId: data.id ?? originalDoc?.id,
        req,
        slug: getFallbackSlug(),
      })
    }
    return data
  }
}
