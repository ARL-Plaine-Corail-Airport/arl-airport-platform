import type { CollectionConfig } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { NewsEvents } from '@/collections/NewsEvents'
import { Notices } from '@/collections/Notices'
import { Pages } from '@/collections/Pages'
import { syncWorkflowStatus } from '@/collections/workflowStatus'

type FindByIDMock = (...args: unknown[]) => unknown

function getHook(collection: CollectionConfig) {
  const hook = collection.hooks?.beforeChange?.[0]
  expect(typeof hook).toBe('function')
  return hook as NonNullable<typeof hook>
}

function findFieldByName(fields: readonly unknown[], name: string): any {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue

    if ('name' in field && field.name === name) {
      return field
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nestedField = findFieldByName(field.fields, name)
      if (nestedField) return nestedField
    }

    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if (tab && typeof tab === 'object' && 'fields' in tab && Array.isArray(tab.fields)) {
          const nestedField = findFieldByName(tab.fields, name)
          if (nestedField) return nestedField
        }
      }
    }
  }
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
  it('lets approvers publish NewsEvents from review with Payload Publish', async () => {
    const data = await runBeforeChange(NewsEvents, {
      data: { _status: 'published', status: 'in_review' },
      roles: ['approver'],
    })

    expect(data.status).toBe('published')
    expect(data.publishedAt).toEqual(expect.any(String))
  })

  it('requires approver sign-off to publish NewsEvents', async () => {
    await expect(
      runBeforeChange(NewsEvents, {
        data: { _status: 'published', status: 'in_review' },
        roles: ['operations_editor'],
      }),
    ).rejects.toThrow('Only approvers can publish news/events after review.')
  })

  it('reads the previous Pages status on partial publish updates', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 7, status: 'in_review' })

    const data = await runBeforeChange(Pages, {
      data: { id: 7, _status: 'published' },
      roles: ['approver'],
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
        roles: ['approver'],
        findByID,
      }),
    ).rejects.toThrow('Only approvers can publish pages after review.')
  })

  it('requires approver sign-off to publish Pages', async () => {
    await expect(
      runBeforeChange(Pages, {
        data: { _status: 'published', status: 'in_review' },
        roles: ['operations_editor'],
      }),
    ).rejects.toThrow('Only approvers can publish pages after review.')
  })

  it('lets approvers publish Notices from Payload Publish and records approval metadata', async () => {
    const data = await runBeforeChange(Notices, {
      data: { _status: 'published', status: 'approved' },
      roles: ['approver'],
    })

    expect(data.status).toBe('published')
    expect(data.publishedAt).toEqual(expect.any(String))
    expect(data.lastApprovedBy).toBe(42)
  })

  it('requires Notices to be approved before an approver can publish', async () => {
    await expect(
      runBeforeChange(Notices, {
        data: { _status: 'published', status: 'draft' },
        roles: ['approver'],
      }),
    ).rejects.toThrow('Set status to Approved before publishing this notice.')
  })

  it('records approval metadata from the effective status before publishing', async () => {
    const hook = syncWorkflowStatus({
      collection: 'notices',
      requiredStatusForPublish: 'ready_to_publish',
      publishedStatus: 'published',
      approvalStatus: 'approved',
      publishError: 'Set status to ready before publishing this notice.',
      setLastApprovedBy: true,
    })

    const data = await hook({
      data: { _status: 'published', status: 'approved' },
      operation: 'update',
      req: buildReq(['approver']),
    } as any) as Record<string, unknown>

    expect(data.status).toBe('published')
    expect(data.lastApprovedBy).toBe(42)
  })

  it('keeps the Notices publish gate for non-approvers', async () => {
    await expect(
      runBeforeChange(Notices, {
        data: { _status: 'published', status: 'approved' },
        roles: ['translator'],
      }),
    ).rejects.toThrow('Set status to Approved before publishing this notice.')
  })

  it('does not stamp approval metadata for non-approvers', async () => {
    const hook = syncWorkflowStatus({
      collection: 'notices',
      requiredStatusForPublish: 'approved',
      publishedStatus: 'published',
      approvalStatus: 'approved',
      publishError: 'Set status to Approved before publishing this notice.',
      setLastApprovedBy: true,
    })

    const data = await hook({
      data: { status: 'approved' },
      operation: 'update',
      originalDoc: { id: 8, status: 'in_review' },
      req: buildReq(['operations_editor']),
    } as any) as Record<string, unknown>

    expect(data.status).toBe('approved')
    expect(data.lastApprovedBy).toBeUndefined()
  })

  it('requires approver role for approval status transitions when publishing requires approval', async () => {
    await expect(
      runBeforeChange(Notices, {
        data: { status: 'approved' },
        roles: ['operations_editor'],
        originalDoc: { id: 8, status: 'in_review' },
      }),
    ).rejects.toThrow('Set status to Approved before publishing this notice.')
  })

  it('restricts NewsEvents, Notice, and Page publish fields for non-approvers', async () => {
    const newsStatusField = findFieldByName(NewsEvents.fields, 'status')
    const noticeStatusField = findFieldByName(Notices.fields, 'status')
    const noticePublishedAtField = findFieldByName(Notices.fields, 'publishedAt')
    const noticeExpiresAtField = findFieldByName(Notices.fields, 'expiresAt')
    const noticePromoteToBannerField = findFieldByName(Notices.fields, 'promoteToBanner')
    const pageStatusField = findFieldByName(Pages.fields, 'status')

    expect(newsStatusField.access.create({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'published' },
    })).toBe(false)
    expect(newsStatusField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'published' },
    })).toBe(false)
    expect(newsStatusField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'in_review' },
    })).toBe(true)
    expect(newsStatusField.access.update({
      req: buildReq(['approver']),
      siblingData: { status: 'published' },
    })).toBe(true)
    expect(noticeStatusField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'approved' },
    })).toBe(false)
    expect(noticePublishedAtField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'published', publishedAt: new Date().toISOString() },
    })).toBe(false)
    expect(noticeExpiresAtField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: {
        status: 'published',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    })).toBe(false)
    expect(noticePromoteToBannerField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { promoteToBanner: true },
    })).toBe(false)
    expect(noticePromoteToBannerField.access.create({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'draft', promoteToBanner: true },
    })).toBe(false)
    expect(noticePromoteToBannerField.access.create({
      req: buildReq(['approver']),
      siblingData: { status: 'published', promoteToBanner: true },
    })).toBe(true)
    expect(noticeStatusField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'in_review' },
    })).toBe(true)
    expect(noticeStatusField.access.update({
      req: buildReq(['approver']),
      siblingData: { status: 'published' },
    })).toBe(true)
    expect(pageStatusField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'published' },
    })).toBe(false)
    expect(pageStatusField.access.update({
      req: buildReq(['operations_editor']),
      siblingData: { status: 'in_review' },
    })).toBe(true)
  })
})
