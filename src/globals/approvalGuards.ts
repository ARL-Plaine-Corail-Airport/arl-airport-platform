import type { GlobalBeforeChangeHook } from 'payload'

export function enforceApproverOnPublish(errorMessage: string): GlobalBeforeChangeHook {
  return ({ data, originalDoc, req }) => {
    const transitioning = data._status === 'published' && originalDoc?._status !== 'published'
    if (!transitioning) return data

    const roles = Array.isArray(req.user?.roles) ? req.user.roles : []
    const isApprover = roles.some((role) =>
      role === 'super_admin' || role === 'content_admin' || role === 'approver',
    )

    if (!isApprover) throw new Error(errorMessage)
    return data
  }
}
