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

  it('falls back to a safe slug when the slugified title is empty', () => {
    randomUUID.mockReturnValue('-rest-of-uuid')

    const hook = autoSlug('title')
    const result = hook({
      data: {
        title: '你好',
      },
    } as any)

    expect(result?.slug).toMatch(/^item-[a-z0-9]+$/)
    expect(result?.slug).not.toBe('item-')
  })
})
