import type { CollectionBeforeChangeHook, CollectionSlug, PayloadRequest } from 'payload'

type WorkflowData = Record<string, unknown> & {
  id?: string | number | null
  _status?: 'draft' | 'published' | null
  status?: string | null
  publishedAt?: string | null
  lastApprovedBy?: string | number | null
}

type WorkflowDoc = {
  id?: string | number
  status?: string | null
}

type SyncWorkflowStatusOptions = {
  collection: CollectionSlug
  requiredStatusForPublish: string
  publishedStatus: string
  publishError: string
  approvalStatus?: string
  requireApproverToPublish?: boolean
  setPublishedAt?: boolean
  setLastApprovedBy?: boolean
}

function hasApproverRole(req: PayloadRequest): boolean {
  const roles = req.user && typeof req.user === 'object'
    ? (req.user as { roles?: unknown }).roles
    : undefined

  return Array.isArray(roles) && roles.some((role) =>
    role === 'super_admin' || role === 'content_admin' || role === 'approver',
  )
}

function hasAdminRole(req: PayloadRequest): boolean {
  const roles = req.user && typeof req.user === 'object'
    ? (req.user as { roles?: unknown }).roles
    : undefined

  return Array.isArray(roles) && roles.some((role) =>
    role === 'super_admin' || role === 'content_admin',
  )
}

async function getPreviousStatus(input: {
  collection: CollectionSlug
  data: WorkflowData
  originalDoc?: WorkflowDoc
  operation: 'create' | 'update'
  req: PayloadRequest
}): Promise<string | null | undefined> {
  if (input.operation !== 'update') {
    return undefined
  }

  if (input.originalDoc?.status !== undefined) {
    return input.originalDoc.status
  }

  const id = input.data.id ?? input.originalDoc?.id
  if (id === undefined || id === null) {
    return input.originalDoc?.status
  }

  const previous = await input.req.payload.findByID({
    collection: input.collection,
    id,
    depth: 0,
    overrideAccess: true,
  }) as WorkflowDoc | null

  return previous?.status ?? input.originalDoc?.status
}

export function syncWorkflowStatus(
  options: SyncWorkflowStatusOptions,
): CollectionBeforeChangeHook {
  return async ({ data, operation, originalDoc, req }) => {
    if (operation !== 'create' && operation !== 'update') return data

    const workflowData = data as WorkflowData
    const previousStatus = await getPreviousStatus({
      collection: options.collection,
      data: workflowData,
      originalDoc: originalDoc as WorkflowDoc | undefined,
      operation,
      req,
    })
    const effectiveStatus = workflowData.status ?? previousStatus
    const userHasApproverRole = hasApproverRole(req)
    const userHasAdminRole = hasAdminRole(req)
    let approvedByCurrentUser = false
    const isApprovalTransition = Boolean(options.approvalStatus) &&
      workflowData.status === options.approvalStatus &&
      previousStatus !== options.approvalStatus
    // Re-publishing a doc that's already live (typo fix on a published article)
    // skips the in_review/approved gate — the previous version was already
    // approved. Approver role is still enforced separately below.
    const isRepublish = previousStatus === options.publishedStatus

    if (
      options.requireApproverToPublish &&
      isApprovalTransition &&
      !userHasApproverRole
    ) {
      throw new Error(options.publishError)
    }

    if (workflowData._status === 'published') {
      if (options.requireApproverToPublish && !userHasApproverRole) {
        throw new Error(options.publishError)
      }

      if (
        options.requireApproverToPublish &&
        !isRepublish &&
        !userHasAdminRole &&
        effectiveStatus !== options.requiredStatusForPublish
      ) {
        throw new Error(options.publishError)
      }

      if (userHasApproverRole) {
        approvedByCurrentUser = isRepublish ||
          userHasAdminRole ||
          effectiveStatus === options.requiredStatusForPublish ||
          (Boolean(options.approvalStatus) && effectiveStatus === options.approvalStatus)
      } else if (!isRepublish && effectiveStatus !== options.requiredStatusForPublish) {
        throw new Error(options.publishError)
      }

      workflowData.status = options.publishedStatus
    } else if (
      workflowData._status === 'draft' &&
      workflowData.status === options.publishedStatus &&
      !isRepublish
    ) {
      // Only demote when a fresh draft is trying to claim "published" without
      // having gone through the workflow. Autosaves of an already-published
      // doc keep status='published' so editors don't have to re-walk the
      // review steps for small edits.
      workflowData.status = 'draft'
    }

    if (
      options.setPublishedAt &&
      workflowData.status === options.publishedStatus &&
      !workflowData.publishedAt
    ) {
      workflowData.publishedAt = new Date().toISOString()
    }

    if (
      options.setLastApprovedBy &&
      (
        (options.approvalStatus !== undefined && workflowData.status === options.approvalStatus) ||
        approvedByCurrentUser
      ) &&
      userHasApproverRole &&
      req.user?.id
    ) {
      workflowData.lastApprovedBy = req.user.id
    }

    return workflowData
  }
}
