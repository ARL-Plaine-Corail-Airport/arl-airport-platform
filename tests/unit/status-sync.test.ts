import type { CollectionConfig } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { NewsEvents } from '@/collections/NewsEvents'
import { Notices } from '@/collections/Notices'
import { Pages } from '@/collections/Pages'

type FindByIDMock = (...args: unknown[]) => unknown

function getHook(collection: CollectionConfig) {
  const hook = collection.hooks?.beforeChange?.[0]
  expect(typeof hook).toBe('function')
  return hook as NonNullable<typeof hook>
}

function buildReq(roles: string[], findByID: FindByIDMock = vi.fn()) {
  return {
    user: {
      id: 42,
      roles,
    },
    payload: {
      findByID,
    },
  } as any
}

async function runBeforeChange(
  collection: CollectionConfig,
  input: {
    data: Record<string, unknown>
    roles?: string[]
    originalDoc?: Record<string, unknown>
    findByID?: FindByIDMock
  },
) {
  return getHook(collection)({
    data: { ...input.data },
    operation: 'update',
    originalDoc: input.originalDoc,
    req: buildReq(input.roles ?? ['approver'], input.findByID),
  } as any) as Promise<Record<string, unknown>>
}

describe('status sync hooks', () => {
  it('lets approvers publish NewsEvents with Payload Publish and auto-promotes the workflow status', async () => {
    const data = await runBeforeChange(NewsEvents, {
      data: { _status: 'published', status: 'draft' },
      roles: ['approver'],
    })

    expect(data.status).toBe('published')
    expect(data.publishedAt).toEqual(expect.any(String))
  })

  it('keeps the existing NewsEvents publish gate for non-approvers', async () => {
    await expect(
      runBeforeChange(NewsEvents, {
        data: { _status: 'published', status: 'draft' },
        roles: ['operations_editor'],
      }),
    ).rejects.toThrow('Set status to Published before using Publish.')
  })

  it('reads the previous Pages status on partial publish updates', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 7, status: 'published' })

    const data = await runBeforeChange(Pages, {
      data: { id: 7, _status: 'published' },
      roles: ['operations_editor'],
      findByID,
    })

    expect(findByID).toHaveBeenCalledWith({
      collection: 'pages',
      id: 7,
      depth: 0,
      overrideAccess: true,
    })
    expect(data.status).toBe('published')
  })

  it('rejects partial Pages publish updates when the previous status is not publishable', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 7, status: 'draft' })

    await expect(
      runBeforeChange(Pages, {
        data: { id: 7, _status: 'published' },
        roles: ['operations_editor'],
        findByID,
      }),
    ).rejects.toThrow('Set status to Published before using Publish.')
  })

  it('lets approvers publish Notices from Payload Publish and records approval metadata', async () => {
    const data = await runBeforeChange(Notices, {
      data: { _status: 'published', status: 'draft' },
      roles: ['approver'],
    })

    expect(data.status).toBe('published')
    expect(data.publishedAt).toEqual(expect.any(String))
    expect(data.lastApprovedBy).toBe(42)
  })

  it('keeps the existing Notices publish gate for non-approvers', async () => {
    await expect(
      runBeforeChange(Notices, {
        data: { _status: 'published', status: 'draft' },
        roles: ['translator'],
      }),
    ).rejects.toThrow('Set status to Approved before publishing this notice.')
  })
})
