import Link from 'next/link'

import '@payloadcms/next/css'
import '@/styles/tokens.css'
import '@/payload-admin-shell.css'

export default function PayloadNotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: 'var(--theme-bg, #0a1929)', color: 'var(--theme-text, #fff)' }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Admin page not found</h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
          This admin route does not exist or you do not have access to it.
        </p>
        <Link href="/admin" style={{ color: 'var(--theme-success-500, #36a0aa)' }}>
          Return to the admin dashboard
        </Link>
      </div>
    </main>
  )
}
