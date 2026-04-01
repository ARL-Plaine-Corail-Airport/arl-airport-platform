'use client'

import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="page-content">
      <div style={{ textAlign: 'center', padding: '3rem 1rem', maxWidth: '28rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Dashboard Error</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Something went wrong loading this page. This has been logged for review.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="btn btn-outline"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
          >
            Dashboard home
          </Link>
        </div>
        {error.digest && (
          <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '1rem' }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
