import './globals.css'
import Link from 'next/link'

import { defaultLocale } from '@/i18n/config'
import { localePath } from '@/i18n/path'

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <main className="page-section">
          <div className="container card empty-state">
            <h1>Page not found</h1>
            <p>The page you requested is not available.</p>
            <Link href={localePath('/', defaultLocale)} className="text-link">
              Return to the homepage
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
