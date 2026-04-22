import { afterEach, describe, expect, it, vi } from 'vitest'

const { randomUUID } = vi.hoisted(() => ({
  randomUUID: vi.fn(),
}))

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>()
  return {
    ...actual,
    randomUUID,
  }
})

import { autoSlug } from '@/hooks/autoSlug'

describe('autoSlug', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    randomUUID.mockReset()
  })

  it('falls back to a safe slug when the slugified title is empty', async () => {
    randomUUID.mockReturnValue('-rest-of-uuid')

    const hook = autoSlug('title')
    const result = await hook({
      data: {
        title: '你好',
      },
    } as any)

    expect(result?.slug).toMatch(/^item-[a-z0-9-]+$/)
    expect(result?.slug).not.toBe('item-')
  })

  it('prefers localized title strings in site locale order', async () => {
    const hook = autoSlug('title')
    const result = await hook({
      data: {
        title: {
          fr: 'Arrivées',
          en: 'Arrivals',
        },
      },
    } as any)

    expect(result?.slug).toBe('arrivals')
  })

  it('caps generated slugs at 120 characters', async () => {
    const hook = autoSlug('title')
    const result = await hook({
      data: {
        title: Array.from({ length: 40 }, () => 'airport').join(' '),
      },
    } as any)

    expect(result?.slug?.length).toBeLessThanOrEqual(120)
    expect(result?.slug).not.toMatch(/-$/)
  })

  it('keeps unique suffixes within the slug length cap', async () => {
    randomUUID.mockReturnValue('slug-test-uuid')
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 99 }] })
    const hook = autoSlug('title')
    const result = await hook({
      collection: { slug: 'pages' },
      data: {
        id: 1,
        title: Array.from({ length: 40 }, () => 'airport').join(' '),
      },
      req: {
        payload: { find },
      },
    } as any)

    expect(result?.slug).toHaveLength(120)
    expect(result?.slug).toMatch(/-[a-f0-9]{8}$/)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: { equals: expect.stringMatching(/^airport/) },
        },
      }),
    )
  })

  it('adds a unique suffix to generated slugs on collection create', async () => {
    randomUUID.mockReturnValue('slug-test-uuid')
    const hook = autoSlug('title')
    const result = await hook({
      collection: { slug: 'news-events' },
      data: {
        title: 'Airport Open Day',
      },
      operation: 'create',
    } as any)

    expect(result?.slug).toMatch(/^airport-open-day-[a-f0-9]{8}$/)
  })
})
