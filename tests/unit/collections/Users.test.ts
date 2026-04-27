import { describe, expect, it, vi } from 'vitest'

import { Users } from '@/collections/Users'

function buildAccessArgs(roles?: string[], extras: Record<string, unknown> = {}) {
  return {
    req: {
      user: roles ? { id: 1, roles } : undefined,
    },
    ...extras,
  } as any
}

function getField(name: string): any {
  const field = Users.fields.find(
    (candidate) => 'name' in candidate && candidate.name === name,
  )

  if (!field) throw new Error(`${name} field is missing`)

  return field
}

function getBeforeDeleteHook() {
  const hook = Users.hooks?.beforeDelete?.[0]
  expect(typeof hook).toBe('function')
  return hook as NonNullable<typeof hook>
}

describe('Users collection', () => {
  it('persists a preferred dashboard locale', () => {
    const preferredLocaleField = getField('preferredLocale')

    expect(Users.admin?.defaultColumns).toContain('preferredLocale')
    expect(preferredLocaleField).toMatchObject({
      type: 'select',
      defaultValue: 'en',
    })

    if (!preferredLocaleField || !('options' in preferredLocaleField)) {
      throw new Error('preferredLocale field is missing select options')
    }

    expect(preferredLocaleField.options).toEqual([
      { label: 'English', value: 'en' },
      { label: 'French', value: 'fr' },
      { label: 'Kreol Morisien', value: 'mfe' },
    ])
  })

  it('does not expose an unenforced MFA advisory flag', () => {
    const hasMfaRequired = Users.fields.some(
      (candidate) => 'name' in candidate && candidate.name === 'mfaRequired',
    )

    expect(hasMfaRequired).toBe(false)
    expect(Users.admin?.defaultColumns).not.toContain('mfaRequired')
  })

  it('allows content admins to manage non-super-admin roles only', async () => {
    const rolesField = getField('roles')
    const expectAccess = async (value: unknown, expected: boolean) => {
      await expect(Promise.resolve(value)).resolves.toBe(expected)
    }

    await expectAccess(rolesField.access.create(buildAccessArgs(['content_admin'], {
      siblingData: { roles: ['operations_editor'] },
    })), true)
    await expectAccess(rolesField.access.update(buildAccessArgs(['content_admin'], {
      doc: { roles: ['operations_editor'] },
      siblingData: { roles: ['translator'] },
    })), true)
    await expectAccess(rolesField.access.create(buildAccessArgs(['content_admin'], {
      siblingData: { roles: ['super_admin'] },
    })), false)
    await expectAccess(rolesField.access.update(buildAccessArgs(['content_admin'], {
      doc: { roles: ['operations_editor'] },
      siblingData: { roles: ['super_admin'] },
    })), false)
    await expectAccess(rolesField.access.update(buildAccessArgs(['content_admin'], {
      doc: { roles: ['super_admin'] },
      siblingData: { roles: ['content_admin'] },
    })), false)
    await expectAccess(rolesField.access.create(buildAccessArgs(['super_admin'], {
      siblingData: { roles: ['super_admin'] },
    })), true)
    await expectAccess(rolesField.access.update(buildAccessArgs(['super_admin'], {
      doc: { roles: ['super_admin'] },
      siblingData: { roles: ['content_admin'] },
    })), true)
  })

  it('keeps user deletion behind the super admin collection gate', () => {
    expect(Users.access?.delete?.(buildAccessArgs(['content_admin']))).toBe(false)
    expect(Users.access?.delete?.(buildAccessArgs(['super_admin']))).toBe(true)
  })

  it('prevents users from deleting their own account', async () => {
    const hook = getBeforeDeleteHook()

    await expect(
      hook({
        id: 1,
        req: {
          user: { id: 1, roles: ['super_admin'] },
          payload: {
            findByID: vi.fn(),
            count: vi.fn(),
          },
        },
      } as any),
    ).rejects.toThrow('You cannot delete your own account.')
  })

  it('prevents deleting the last super admin', async () => {
    const hook = getBeforeDeleteHook()
    const count = vi.fn().mockResolvedValue({ totalDocs: 1 })
    const findByID = vi.fn().mockResolvedValue({ roles: ['super_admin'] })

    await expect(
      hook({
        id: 2,
        req: {
          user: { id: 1, roles: ['super_admin'] },
          payload: { count, findByID },
        },
      } as any),
    ).rejects.toThrow('Cannot delete the last super admin.')

    expect(findByID).toHaveBeenCalledWith({
      collection: 'users',
      id: 2,
      depth: 0,
      overrideAccess: true,
    })
    expect(count).toHaveBeenCalledWith({
      collection: 'users',
      where: {
        roles: {
          contains: 'super_admin',
        },
      },
      overrideAccess: true,
    })
  })

  it('allows deleting a super admin when another super admin remains', async () => {
    const hook = getBeforeDeleteHook()

    await expect(
      hook({
        id: 2,
        req: {
          user: { id: 1, roles: ['super_admin'] },
          payload: {
            findByID: vi.fn().mockResolvedValue({ roles: ['super_admin'] }),
            count: vi.fn().mockResolvedValue({ totalDocs: 2 }),
          },
        },
      } as any),
    ).resolves.toBeUndefined()
  })
})
