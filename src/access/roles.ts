type UserLike = {
  roles?: string[]
} | null | undefined

const hasRole = (user: UserLike, allowed: string[]) =>
  Boolean(user?.roles?.some((role) => allowed.includes(role)))

export const isAdmin = ({ req }: any) =>
  hasRole(req.user, ['super_admin', 'content_admin'])

export const isApprover = ({ req }: any) =>
  hasRole(req.user, ['super_admin', 'content_admin', 'approver'])

export const isEditor = ({ req }: any) =>
  hasRole(req.user, ['super_admin', 'content_admin', 'approver', 'operations_editor', 'translator'])

export const publishedOrAdmin = ({ req }: any) => {
  if (isEditor({ req })) return true

  return {
    status: {
      equals: 'published',
    },
  }
}
