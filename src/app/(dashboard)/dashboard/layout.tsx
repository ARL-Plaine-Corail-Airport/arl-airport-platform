import './dashboard.css'
import '../../globals.css'
import { DashboardShell } from '@/components/dashboard/shell'
import {
  getNavForRoles,
} from '@/lib/dashboard'
import { getDashboardSession } from '@/lib/dashboard-auth'

export const metadata = {
  title: {
    template: '%s | ARL Admin',
    default: 'ARL Admin Dashboard',
  },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getDashboardSession()

  return (
    <html lang={session.locale}>
      <body>
        <DashboardShell
          navSections={getNavForRoles(session.roles)}
          user={{
            email: session.user.email || '',
            fullName: session.fullName,
            initials: session.initials,
            role: session.primaryRole,
            roleLabel: session.roleLabel,
            roleBadgeClass: session.roleBadgeClass,
          }}
        >
          {children}
        </DashboardShell>
      </body>
    </html>
  )
}
