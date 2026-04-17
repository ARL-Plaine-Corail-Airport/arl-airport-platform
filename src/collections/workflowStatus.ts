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

async function getPreviousStatus(input: {
  collection: CollectionSlug
  data: WorkflowData
  originalDoc?: WorkflowDoc
  operation: 'create' | 'update'
  req: PayloadRequest
}): Promise<string | null | undefined> {
  if (input.data.status !== undefined || input.operation !== 'update') {
    return input.data.status
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
    let approvedByCurrentUser = false

    if (workflowData._status === 'published') {
      if (hasApproverRole(req)) {
        workflowData.status = options.requiredStatusForPublish
        approvedByCurrentUser = workflowData.status === options.approvalStatus
      } else if (effectiveStatus !== options.requiredStatusForPublish) {
        throw new Error(options.publishError)
      }

      workflowData.status = options.publishedStatus
    } else if (
      workflowData._status === 'draft' &&
      workflowData.status === options.publishedStatus
    ) {
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
      options.approvalStatus &&
      (workflowData.status === options.approvalStatus || approvedByCurrentUser) &&
      req.user?.id
    ) {
      workflowData.lastApprovedBy = req.user.id
    }

    return workflowData
  }
}
