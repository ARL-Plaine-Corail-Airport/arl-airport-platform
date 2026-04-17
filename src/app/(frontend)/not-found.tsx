import Link from 'next/link'

import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'

export default async function FrontendNotFound() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  return (
    <main className="page-section">
      <div className="container card empty-state">
        <p className="meta">{dict.pages.eyebrow_official_info}</p>
        <h1>{dict.pages.page_not_found}</h1>
        <p>{dict.pages.page_not_found_desc}</p>
        <Link href={localePath('/', locale)} className="text-link">
          {dict.errors.home}
        </Link>
      </div>
    </main>
  )
}
