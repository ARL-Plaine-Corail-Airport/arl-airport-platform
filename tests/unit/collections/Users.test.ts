import { describe, expect, it, vi } from 'vitest'

import { Users } from '@/collections/Users'

function buildAccessArgs(roles?: string[]) {
  return {
    req: {
      user: roles ? { id: 1, roles } : undefined,
    },
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

  it('marks MFA as advisory because it is not enforced in this app', () => {
    const mfaField = getField('mfaRequired')

    expect(mfaField.label).toBe('MFA Required (advisory - not enforced)')
    expect(mfaField.admin?.description).toContain('not currently enforced')
    expect(mfaField.admin?.description).toContain('Do not rely on it as a security control')
  })

  it('only allows super admins to assign roles during create or update', async () => {
    const rolesField = getField('roles')

    await expect(Promise.resolve(rolesField.access.create(buildAccessArgs(['content_admin']))))
      .resolves.toBe(false)
    await expect(Promise.resolve(rolesField.access.create(buildAccessArgs(['super_admin']))))
      .resolves.toBe(true)
    await expect(Promise.resolve(rolesField.access.update(buildAccessArgs(['content_admin']))))
      .resolves.toBe(false)
    await expect(Promise.resolve(rolesField.access.update(buildAccessArgs(['super_admin']))))
      .resolves.toBe(true)
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
