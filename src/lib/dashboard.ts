export type DashboardRole =
  | 'super_admin'
  | 'content_admin'
  | 'approver'
  | 'operations_editor'
  | 'translator'
  | 'viewer_auditor'

export type NavItem = {
  id: string
  label: string
  href: string
  icon: string
}

export type NavSection = {
  label: string
  items: NavItem[]
}

const ROLE_PRIORITY: DashboardRole[] = [
  'super_admin',
  'content_admin',
  'approver',
  'operations_editor',
  'translator',
  'viewer_auditor',
]

const ROLE_LABELS: Record<DashboardRole, string> = {
  super_admin: 'Super Admin',
  content_admin: 'Content Admin',
  approver: 'Approver',
  operations_editor: 'Operations Editor',
  translator: 'Translator',
  viewer_auditor: 'Viewer / Auditor',
}

const ROLE_BADGE: Record<DashboardRole, string> = {
  super_admin: 'role-super',
  content_admin: 'role-editor',
  approver: 'role-editor',
  operations_editor: 'role-editor',
  translator: 'role-viewer',
  viewer_auditor: 'role-viewer',
}

// Source of truth for dashboard section access. Middleware only handles the
// unauthenticated redirect and does not duplicate role checks.
const ROLE_ACCESS: Record<DashboardRole, string[]> = {
  super_admin: [
    'overview', 'analytics', 'flights', 'notices', 'emergency', 'weather',
    'pages', 'faqs', 'airlines', 'amenities', 'transport', 'media',
    'users', 'audit', 'settings',
  ],
  content_admin: [
    'overview', 'analytics', 'flights', 'notices', 'emergency', 'weather',
    'pages', 'faqs', 'airlines', 'amenities', 'transport', 'media',
    'users', 'audit',
  ],
  approver: ['overview', 'flights', 'notices', 'pages', 'faqs'],
  operations_editor: [
    'overview', 'flights', 'notices', 'weather', 'pages', 'faqs',
    'amenities', 'transport',
  ],
  translator: ['overview', 'notices', 'pages', 'faqs'],
  viewer_auditor: ['overview', 'flights', 'notices', 'pages'],
}

const ALL_NAV = [
  { id: 'overview',   label: 'Dashboard',          href: '/dashboard',           icon: 'dashboard', group: 'Overview' },
  { id: 'analytics',  label: 'Analytics',           href: '/dashboard/analytics', icon: 'analytics', group: 'Overview' },
  { id: 'flights',    label: 'Flights',              href: '/dashboard/flights',   icon: 'flights',   group: 'Operations' },
  { id: 'notices',    label: 'Notices',              href: '/dashboard/notices',   icon: 'notices',   group: 'Operations' },
  { id: 'emergency',  label: 'Emergency Banners',    href: '/dashboard/emergency', icon: 'emergency', group: 'Operations' },
  { id: 'weather',    label: 'Weather',              href: '/dashboard/weather',   icon: 'weather',   group: 'Operations' },
  { id: 'pages',      label: 'Pages',                href: '/dashboard/pages-cms', icon: 'pages',     group: 'Content' },
  { id: 'faqs',       label: 'FAQs',                 href: '/dashboard/faqs',      icon: 'faqs',      group: 'Content' },
  { id: 'airlines',   label: 'Airlines',             href: '/dashboard/airlines',  icon: 'airlines',  group: 'Content' },
  { id: 'amenities',  label: 'Amenities & Services', href: '/dashboard/amenities', icon: 'amenities', group: 'Content' },
  { id: 'transport',  label: 'Transport & Parking',  href: '/dashboard/transport', icon: 'transport', group: 'Content' },
  { id: 'media',      label: 'Media Library',        href: '/dashboard/media',     icon: 'media',     group: 'Content' },
  { id: 'users',      label: 'Users & Roles',        href: '/dashboard/users',     icon: 'users',     group: 'Administration' },
  { id: 'audit',      label: 'Audit Log',            href: '/dashboard/audit',     icon: 'audit',     group: 'Administration' },
  { id: 'settings',   label: 'Settings',             href: '/dashboard/settings',  icon: 'settings',  group: 'Administration' },
]

function getAllowedSections(roles: string[]): string[] {
  const sections = new Set<string>()

  for (const role of roles) {
    const access = ROLE_ACCESS[role as DashboardRole]

    if (!access) continue

    for (const section of access) {
      sections.add(section)
    }
  }

  return Array.from(sections)
}

export function getPrimaryRole(roles: string[]): DashboardRole | null {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role
  }
  return null
}

export function getRoleLabel(role: DashboardRole): string {
  return ROLE_LABELS[role] ?? role
}

export function getRoleBadgeClass(role: DashboardRole): string {
  return ROLE_BADGE[role] ?? 'role-viewer'
}

export function canAccess(role: string, section: string): boolean {
  const access = ROLE_ACCESS[role as DashboardRole]
  if (!access) return false
  return access.includes(section)
}

export function canAccessAny(roles: string[], section: string): boolean {
  return getAllowedSections(roles).includes(section)
}

export function getNavForRole(role: DashboardRole): NavSection[] {
  return getNavForRoles([role])
}

export function getNavForRoles(roles: string[]): NavSection[] {
  const allowed = getAllowedSections(roles)
  const filtered = ALL_NAV.filter((item) => allowed.includes(item.id))

  const groupOrder = ['Overview', 'Operations', 'Content', 'Administration']
  const sectionsMap = new Map<string, NavItem[]>()

  for (const item of filtered) {
    if (!sectionsMap.has(item.group)) {
      sectionsMap.set(item.group, [])
    }
    sectionsMap.get(item.group)!.push({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: item.icon,
    })
  }

  const sections: NavSection[] = []
  for (const group of groupOrder) {
    const items = sectionsMap.get(group)
    if (items && items.length > 0) {
      sections.push({ label: group, items })
    }
  }

  return sections
}

export function getInitials(nameOrEmail: string): string {
  const trimmed = nameOrEmail.trim()
  if (!trimmed) return '?'

  // If it looks like an email, use first letter before @
  if (trimmed.includes('@')) {
    return trimmed.charAt(0).toUpperCase()
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
