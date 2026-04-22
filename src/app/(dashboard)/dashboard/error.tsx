'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { defaultLocale, isValidLocale } from '@/i18n/config'

type ErrorLabels = {
  title: string
  description: string
  retry: string
  home: string
  errorId: string
}

const labels: Record<string, ErrorLabels> = {
  en: {
    title: 'Dashboard Error',
    description: 'Something went wrong loading this page. This has been logged for review.',
    retry: 'Try again',
    home: 'Dashboard home',
    errorId: 'Error ID',
  },
  fr: {
    title: 'Erreur du tableau de bord',
    description: 'Une erreur est survenue lors du chargement de cette page. Elle a ete consignee pour examen.',
    retry: 'Reessayer',
    home: 'Accueil du tableau de bord',
    errorId: "ID d'erreur",
  },
  mfe: {
    title: 'Erer tablo de bor',
    description: "Ena enn keksoz ki'nn mal pas kan ti pe sarz sa paz la. Sa finn anrezistre pou revizion.",
    retry: 'Reesey',
    home: 'Lakaz tablo de bor',
    errorId: 'ID erer',
  },
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const localeCandidate = pathname.split('/').filter(Boolean)[0]
  const locale = isValidLocale(localeCandidate) ? localeCandidate : defaultLocale
  const label = labels[locale] ?? labels.en

  return (
    <main className="page-content">
      <div style={{ textAlign: 'center', padding: '3rem 1rem', maxWidth: '28rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{label.title}</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {label.description}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
          >
            {label.retry}
          </button>
          <Link
            href="/dashboard"
            className="btn btn-outline"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
          >
            {label.home}
          </Link>
        </div>
        {error.digest && (
          <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '1rem' }}>
            {label.errorId}: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
