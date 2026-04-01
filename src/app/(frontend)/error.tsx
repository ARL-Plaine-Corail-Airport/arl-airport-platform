'use client'

import Link from 'next/link'

import { useI18n } from '@/i18n/provider'

export default function FrontendError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { localePath: lp } = useI18n()

  return (
    <main className="site-main">
      <section className="section" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="container" style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again or return to the home page.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={reset} className="btn-primary">
              Try again
            </button>
            <Link href={lp('/')} className="btn-outline">
              Home page
            </Link>
          </div>
          {error.digest && (
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
