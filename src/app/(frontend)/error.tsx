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
  const { localePath: lp, t } = useI18n()

  return (
    <main className="site-main">
      <section className="section" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="container" style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{t('errors.title')}</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            {t('errors.description')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={reset} className="btn-primary">
              {t('errors.retry')}
            </button>
            <Link href={lp('/')} className="btn-outline">
              {t('errors.home')}
            </Link>
          </div>
          {error.digest && (
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
              {t('errors.error_id')}: {error.digest}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
