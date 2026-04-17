'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import './globals.css'

import { defaultLocale, isValidLocale, type Locale } from '@/i18n/config'
import en from '@/i18n/dictionaries/en.json'
import fr from '@/i18n/dictionaries/fr.json'
import mfe from '@/i18n/dictionaries/mfe.json'
import { localePath } from '@/i18n/path'

const errorDictionaries = {
  en: en.errors,
  fr: fr.errors,
  mfe: mfe.errors,
} as const

function detectLocale(): Locale {
  if (typeof document !== 'undefined' && isValidLocale(document.documentElement.lang)) {
    return document.documentElement.lang
  }

  if (typeof window === 'undefined') return defaultLocale

  const firstSegment = window.location.pathname.split('/').filter(Boolean)[0] ?? ''
  return isValidLocale(firstSegment) ? firstSegment : defaultLocale
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  useEffect(() => {
    setLocale(detectLocale())
  }, [])

  const copy = errorDictionaries[locale]

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <main className="site-main">
          <section className="section" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="container" style={{ maxWidth: '32rem' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{copy.title}</h1>
              <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>{copy.description}</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => reset()} className="btn-primary">
                  {copy.retry}
                </button>
                <Link href={localePath('/', locale)} className="btn-outline">
                  {copy.home}
                </Link>
              </div>
              {error.digest && (
                <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                  {copy.error_id}: {error.digest}
                </p>
              )}
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
