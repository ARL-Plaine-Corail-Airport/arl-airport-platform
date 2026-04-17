import './globals.css'
import Link from 'next/link'

import { defaultLocale } from '@/i18n/config'
import { localePath } from '@/i18n/path'

const labels: Record<
  string,
  { title: string; body: string; link: string }
> = {
  en: {
    title: 'Page not found',
    body: 'The page you requested is not available.',
    link: 'Return to the homepage',
  },
  fr: {
    title: 'Page introuvable',
    body: "La page demand\u00E9e n'est pas disponible.",
    link: "Retour \u00E0 la page d'accueil",
  },
  mfe: {
    title: 'Paz inn trouv sa paz la',
    body: 'Paz ki ou pe rod la pa disponib.',
    link: 'Retourn lor paz prinsipal',
  },
}

export default function NotFound() {
  const label = labels[defaultLocale] ?? labels.en

  return (
    <html lang={defaultLocale}>
      <body>
        <main className="page-section">
          <div className="container card empty-state">
            <h1>{label.title}</h1>
            <p>{label.body}</p>
            <Link href={localePath('/', defaultLocale)} className="text-link">
              {label.link}
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
