import React from 'react'
import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'
import {
  getPrimaryRole,
  getRoleLabel,
  getRoleBadgeClass,
  getInitials,
} from '@/lib/dashboard'
import type { DashboardRole } from '@/lib/dashboard'

export const metadata = { title: 'Users & Roles' }

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

// Role permission matrix data
type PermRow = {
  module: string
  super_admin: boolean
  content_admin: boolean
  approver: boolean
  operations_editor: boolean
  translator: boolean
  viewer_auditor: boolean
}

const PERM_MATRIX: PermRow[] = [
  { module: 'Dashboard',       super_admin: true,  content_admin: true,  approver: true,  operations_editor: true,  translator: true,  viewer_auditor: true },
  { module: 'Analytics',       super_admin: true,  content_admin: true,  approver: false, operations_editor: false, translator: false, viewer_auditor: false },
  { module: 'Flights',         super_admin: true,  content_admin: true,  approver: true,  operations_editor: true,  translator: false, viewer_auditor: true },
  { module: 'Notices',         super_admin: true,  content_admin: true,  approver: true,  operations_editor: true,  translator: true,  viewer_auditor: true },
  { module: 'Emergency Banners', super_admin: true, content_admin: true, approver: false, operations_editor: false, translator: false, viewer_auditor: false },
  { module: 'Weather',         super_admin: true,  content_admin: true,  approver: false, operations_editor: true,  translator: false, viewer_auditor: false },
  { module: 'Pages & Content', super_admin: true,  content_admin: true,  approver: true,  operations_editor: true,  translator: true,  viewer_auditor: true },
  { module: 'FAQs',            super_admin: true,  content_admin: true,  approver: true,  operations_editor: true,  translator: true,  viewer_auditor: false },
  { module: 'Airlines',        super_admin: true,  content_admin: true,  approver: false, operations_editor: false, translator: false, viewer_auditor: false },
  { module: 'Amenities',       super_admin: true,  content_admin: true,  approver: false, operations_editor: true,  translator: false, viewer_auditor: false },
  { module: 'Transport',       super_admin: true,  content_admin: true,  approver: false, operations_editor: true,  translator: false, viewer_auditor: false },
  { module: 'Media Library',   super_admin: true,  content_admin: true,  approver: false, operations_editor: false, translator: false, viewer_auditor: false },
  { module: 'Users & Roles',   super_admin: true,  content_admin: true,  approver: false, operations_editor: false, translator: false, viewer_auditor: false },
  { module: 'Audit Log',       super_admin: true,  content_admin: true,  approver: false, operations_editor: false, translator: false, viewer_auditor: false },
  { module: 'Settings',        super_admin: true,  content_admin: false, approver: false, operations_editor: false, translator: false, viewer_auditor: false },
]

const ROLE_COLS: { key: keyof Omit<PermRow, 'module'>; label: string }[] = [
  { key: 'super_admin',       label: 'Super Admin' },
  { key: 'content_admin',     label: 'Content Admin' },
  { key: 'approver',          label: 'Approver' },
  { key: 'operations_editor', label: 'Operations' },
  { key: 'translator',        label: 'Translator' },
  { key: 'viewer_auditor',    label: 'Viewer' },
]

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  await requireDashboardSectionAccess('users')
  const params = await searchParams
  const activeTab = params.tab ?? 'all'

  const payload = await getPayloadClient()
  let users: any[] = []

  try {
    const result = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 200,
      sort: 'fullName',
      overrideAccess: true,
    })
    users = result.docs as any[]
  } catch (error) { logger.error('Failed to fetch users', error, 'dashboard') }

  // Filter by tab
  let filtered = users
  if (activeTab === 'super_admin') {
    filtered = users.filter((u) => u.roles?.includes('super_admin'))
  } else if (activeTab === 'editors') {
    filtered = users.filter((u) =>
      u.roles?.some((r: string) => ['content_admin', 'approver', 'operations_editor'].includes(r))
    )
  } else if (activeTab === 'viewers') {
    filtered = users.filter((u) =>
      u.roles?.some((r: string) => ['translator', 'viewer_auditor'].includes(r))
    )
  }

  const superCount = users.filter((u) => u.roles?.includes('super_admin')).length
  const editorCount = users.filter((u) =>
    u.roles?.some((r: string) => ['content_admin', 'approver', 'operations_editor'].includes(r))
  ).length
  const viewerCount = users.filter((u) =>
    u.roles?.some((r: string) => ['translator', 'viewer_auditor'].includes(r))
  ).length

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Users &amp; Roles</h1>
          <p className="page-subtitle">
            Manage admin users and their access permissions
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/collections/users/create" className="btn btn-primary">
            <PlusIcon />
            Invite User
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{users.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Super Admins</div>
            <div className="stat-value">{superCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Editors</div>
            <div className="stat-value">{editorCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Viewers</div>
            <div className="stat-value">{viewerCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <Link href="/dashboard/users?tab=all" className={`tab${activeTab === 'all' ? ' active' : ''}`}>
          All Users
          <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>{users.length}</span>
        </Link>
        <Link href="/dashboard/users?tab=super_admin" className={`tab${activeTab === 'super_admin' ? ' active' : ''}`}>
          Super Admins
          <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>{superCount}</span>
        </Link>
        <Link href="/dashboard/users?tab=editors" className={`tab${activeTab === 'editors' ? ' active' : ''}`}>
          Editors
          <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>{editorCount}</span>
        </Link>
        <Link href="/dashboard/users?tab=viewers" className={`tab${activeTab === 'viewers' ? ' active' : ''}`}>
          Viewers
          <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>{viewerCount}</span>
        </Link>
      </div>

      {/* Users table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </h2>
          <Link
            href="/admin/collections/users"
            className="btn btn-outline btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Payload
          </Link>
        </div>
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>No users in this category</h3>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>MFA</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const primaryRole = getPrimaryRole(user.roles ?? [])
                  const initials = getInitials(user.fullName || user.email)
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `hsl(var(--${getRoleBadgeClass(primaryRole) === 'role-super' ? 'primary' : 'accent'}))`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {initials}
                          </div>
                          <span style={{ fontWeight: 500 }}>
                            {user.fullName || 'No name'}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs text-muted">{user.email}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(user.roles ?? []).map((role: string) => (
                            <span
                              key={role}
                              className={`role-badge ${getRoleBadgeClass(role as DashboardRole)}`}
                            >
                              {getRoleLabel(role as DashboardRole)}
                            </span>
                          ))}
                          {(!user.roles || user.roles.length === 0) && (
                            <span className="badge badge-muted">No role</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {user.mfaRequired ? (
                          <span className="badge badge-success">Required</span>
                        ) : (
                          <span className="badge badge-muted">Optional</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-success">Active</span>
                      </td>
                      <td className="text-xs text-muted">{formatDate(user.updatedAt)}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/admin/collections/users/${user.id}`}
                            className="btn btn-outline btn-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <EditIcon /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Role Permissions Matrix</h2>
          <span className="badge badge-muted">6 roles · {PERM_MATRIX.length} modules</span>
        </div>
        <div className="card-body" style={{ padding: '16px 18px', overflowX: 'auto' }}>
          <div className="perm-grid">
            {/* Header row */}
            <div className="perm-cell header" style={{ justifyContent: 'flex-start' }}>Module</div>
            {ROLE_COLS.map((col) => (
              <div key={col.key} className="perm-cell header" style={{ justifyContent: 'center', textAlign: 'center' }}>
                {col.label}
              </div>
            ))}

            {/* Data rows */}
            {PERM_MATRIX.map((row, rowIdx) => (
              <React.Fragment key={row.module}>
                <div className="perm-cell row-label"
                  style={{
                    background: rowIdx % 2 === 0 ? 'hsl(var(--muted-bg))' : 'hsl(var(--card))',
                    borderBottom: rowIdx < PERM_MATRIX.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}>
                  {row.module}
                </div>
                {ROLE_COLS.map((col) => (
                  <div key={col.key} className="perm-cell"
                    style={{
                      background: rowIdx % 2 === 0 ? 'hsl(var(--muted-bg))' : 'hsl(var(--card))',
                      justifyContent: 'center',
                      borderBottom: rowIdx < PERM_MATRIX.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}>
                    {row[col.key] ? (
                      <span className="perm-check" aria-label="Allowed">✓</span>
                    ) : (
                      <span className="perm-x" aria-label="Not allowed">✗</span>
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="card-footer">
          Permissions are enforced per dashboard route and in the Payload CMS access-control layer.
        </div>
      </div>
    </main>
  )
}
