import { describe, expect, it } from 'vitest'

import { isAdmin, isApprover, isEditor, publishedOrAdmin } from '@/access'
import * as reexportedAccess from '@/access/index'

function buildAccessArgs(roles?: string[]) {
  return {
    req: {
      user: roles ? { roles } : undefined,
    },
  } as any
}

describe('access roles', () => {
  it('treats super admins and content admins as admins only', () => {
    expect(isAdmin(buildAccessArgs(['super_admin']))).toBe(true)
    expect(isAdmin(buildAccessArgs(['content_admin']))).toBe(true)
    expect(isAdmin(buildAccessArgs(['viewer_auditor']))).toBe(false)
  })

  it('allows operations editors through editor access', () => {
    expect(isEditor(buildAccessArgs(['operations_editor']))).toBe(true)
  })

  it('allows approvers through approver access', () => {
    expect(isApprover(buildAccessArgs(['approver']))).toBe(true)
  })

  it('allows published content for anonymous users and drafts for admins only', () => {
    expect(publishedOrAdmin(buildAccessArgs())).toEqual({
      status: { equals: 'published' },
    })
    expect(publishedOrAdmin(buildAccessArgs(['super_admin']))).toBe(true)
    expect(publishedOrAdmin(buildAccessArgs(['operations_editor']))).toEqual({
      status: { equals: 'published' },
    })
  })

  it('keeps the access re-export aligned with the shared role helpers', () => {
    expect(reexportedAccess.isAdmin(buildAccessArgs(['content_admin']))).toBe(true)
    expect(reexportedAccess.publishedOrAdmin(buildAccessArgs(['operations_editor']))).toEqual({
      status: { equals: 'published' },
    })
  })
})
