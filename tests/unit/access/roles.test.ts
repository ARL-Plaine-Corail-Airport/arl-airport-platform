import { describe, expect, it } from 'vitest'

import {
  isAdmin,
  isApprover,
  isDocumentReader,
  isEditor,
  publishedOrAdmin,
  publishedVersionOrAdmin,
} from '@/access'
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

  it('restricts protected document reads to admins, approvers, and operations editors', () => {
    expect(isDocumentReader(buildAccessArgs(['super_admin']))).toBe(true)
    expect(isDocumentReader(buildAccessArgs(['content_admin']))).toBe(true)
    expect(isDocumentReader(buildAccessArgs(['approver']))).toBe(true)
    expect(isDocumentReader(buildAccessArgs(['operations_editor']))).toBe(true)
    expect(isDocumentReader(buildAccessArgs(['translator']))).toBe(false)
    expect(isDocumentReader(buildAccessArgs(['viewer_auditor']))).toBe(false)
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

  it('supports collections that rely on Payload draft status instead of a custom status field', () => {
    expect(publishedVersionOrAdmin(buildAccessArgs())).toEqual({
      _status: { equals: 'published' },
    })
    expect(publishedVersionOrAdmin(buildAccessArgs(['super_admin']))).toBe(true)
  })

  it('keeps the access re-export aligned with the shared role helpers', () => {
    expect(reexportedAccess.isAdmin(buildAccessArgs(['content_admin']))).toBe(true)
    expect(reexportedAccess.publishedOrAdmin(buildAccessArgs(['operations_editor']))).toEqual({
      status: { equals: 'published' },
    })
    expect(reexportedAccess.publishedVersionOrAdmin(buildAccessArgs(['operations_editor']))).toEqual({
      _status: { equals: 'published' },
    })
  })
})
