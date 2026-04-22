'use client'

import { useEffect } from 'react'

export default function PayloadAdminError({
  error,
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[payload-admin] render error:', error)
  }, [error])

  return (
    <div style={{ padding: '2rem', color: 'var(--theme-text, #fff)' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Admin view failed to render</h2>
      <p style={{ opacity: 0.8, marginBottom: '1rem' }}>{error.message}</p>
      {error.digest && (
        <p style={{ opacity: 0.6, fontSize: 12, marginBottom: '1rem' }}>digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        style={{ padding: '6px 14px', background: 'var(--theme-elevation-150, #2a3a4d)', color: 'inherit', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  )
}
