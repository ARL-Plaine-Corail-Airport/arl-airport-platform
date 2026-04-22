import type { GlobalBeforeChangeHook } from 'payload'

export function appendApprovalHistoryHook(): GlobalBeforeChangeHook {
  return ({ data, originalDoc, req }) => {
    const isPublishing = data._status === 'published' && originalDoc?._status !== 'published'
    if (!isPublishing || !req.user?.id) return data

    const history = Array.isArray(originalDoc?.approvalHistory)
      ? originalDoc.approvalHistory
      : []

    data.approvalHistory = [
      ...history,
      {
        approvedBy: req.user.id,
        approvedAt: new Date().toISOString(),
        notes: typeof data.approvalNotes === 'string' ? data.approvalNotes : null,
      },
    ]
    data.approvalNotes = null

    return data
  }
}
