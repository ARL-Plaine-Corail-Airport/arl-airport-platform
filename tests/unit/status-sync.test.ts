import { describe, expect, it } from 'vitest'

/**
 * Extract the beforeChange hook logic from each collection to test it in
 * isolation. The hooks are inline lambdas, so we replicate the logic here
 * and verify that the fix (status !== 'published' instead of === 'draft')
 * works for all intermediate states.
 */

function syncStatus(data: Record<string, unknown>): Record<string, unknown> {
  // This mirrors the corrected hook logic shared by Notices, NewsEvents, AirportProject
  if (data._status === 'published' && data.status !== 'published') {
    data.status = 'published'
  }
  if (data._status === 'draft' && data.status === 'published') {
    data.status = 'draft'
  }
  if (data.status === 'published' && !data.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }
  return data
}

describe('status sync hook logic', () => {
  it('forces status to published when _status is published and status is draft', () => {
    const data = syncStatus({ _status: 'published', status: 'draft' })
    expect(data.status).toBe('published')
  })

  it('forces status to published when _status is published and status is in_review', () => {
    const data = syncStatus({ _status: 'published', status: 'in_review' })
    expect(data.status).toBe('published')
  })

  it('forces status to published when _status is published and status is approved', () => {
    const data = syncStatus({ _status: 'published', status: 'approved' })
    expect(data.status).toBe('published')
  })

  it('does not change status when both _status and status are published', () => {
    const data = syncStatus({ _status: 'published', status: 'published', publishedAt: '2026-01-01' })
    expect(data.status).toBe('published')
  })

  it('reverts status to draft when _status is draft but status is published', () => {
    const data = syncStatus({ _status: 'draft', status: 'published' })
    expect(data.status).toBe('draft')
  })

  it('does not touch non-published statuses when _status is draft', () => {
    const data = syncStatus({ _status: 'draft', status: 'in_review' })
    expect(data.status).toBe('in_review')
  })

  it('sets publishedAt when status becomes published and publishedAt is empty', () => {
    const data = syncStatus({ _status: 'published', status: 'in_review' })
    expect(data.status).toBe('published')
    expect(data.publishedAt).toBeTruthy()
  })

  it('does not overwrite an existing publishedAt', () => {
    const existing = '2025-06-01T00:00:00.000Z'
    const data = syncStatus({ _status: 'published', status: 'draft', publishedAt: existing })
    expect(data.publishedAt).toBe(existing)
  })
})
