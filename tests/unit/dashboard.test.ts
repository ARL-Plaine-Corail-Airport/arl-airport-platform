import { describe, expect, it } from 'vitest'

import {
  canAccessAny,
  getInitials,
  getNavForRole,
  getPrimaryRole,
  getRoleBadgeClass,
  getRoleLabel,
} from '@/lib/dashboard'

describe('getPrimaryRole', () => {
  it('returns highest-priority role', () => {
    expect(getPrimaryRole(['viewer_auditor', 'super_admin'])).toBe('super_admin')
    expect(getPrimaryRole(['translator', 'approver'])).toBe('approver')
  })

  it('returns null for unknown roles', () => {
    expect(getPrimaryRole(['unknown_role'])).toBe(null)
    expect(getPrimaryRole([])).toBe(null)
  })
})

describe('getRoleLabel', () => {
  it('returns human-readable label', () => {
    expect(getRoleLabel('super_admin')).toBe('Super Admin')
    expect(getRoleLabel('content_admin')).toBe('Content Admin')
  })
})

describe('getRoleBadgeClass', () => {
  it('returns badge CSS class', () => {
    expect(getRoleBadgeClass('super_admin')).toBe('role-super')
    expect(getRoleBadgeClass('translator')).toBe('role-viewer')
  })
})

describe('canAccessAny', () => {
  it('grants super_admin access to everything', () => {
    expect(canAccessAny(['super_admin'], 'settings')).toBe(true)
    expect(canAccessAny(['super_admin'], 'overview')).toBe(true)
  })

  it('denies viewer_auditor access to settings', () => {
    expect(canAccessAny(['viewer_auditor'], 'settings')).toBe(false)
  })

  it('returns false for unknown roles', () => {
    expect(canAccessAny(['nonexistent'], 'overview')).toBe(false)
  })
})

describe('getNavForRole', () => {
  it('returns grouped nav sections', () => {
    const nav = getNavForRole('super_admin')
    expect(nav.length).toBeGreaterThan(0)
    expect(nav[0].label).toBe('Overview')
  })

  it('limits viewer_auditor to allowed sections', () => {
    const nav = getNavForRole('viewer_auditor')
    const allIds = nav.flatMap((s) => s.items.map((i) => i.id))
    expect(allIds).toContain('overview')
    expect(allIds).not.toContain('settings')
    expect(allIds).not.toContain('users')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns first letter from single name', () => {
    expect(getInitials('Admin')).toBe('A')
  })

  it('returns first letter from email', () => {
    expect(getInitials('admin@example.com')).toBe('A')
  })

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?')
  })
})
