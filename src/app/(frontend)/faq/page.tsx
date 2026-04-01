import { headers } from 'next/headers'

import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getFAQs } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'
import { buildFAQPageSchema, JsonLd } from '@/lib/structured-data'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.faq_title} - ${dict.common.airport_location}`,
    description: dict.pages.faq_summary,
    path: '/faq',
  })
}

export default async function FAQPage() {
  const locale = await getLocale()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const [dict, faqs] = await Promise.all([getDictionary(locale), getFAQs(locale)])

  const faqSchema = faqs.length
    ? buildFAQPageSchema(
        faqs.map((faq: any) => ({ question: faq.question, answer: faq.answer })),
      )
    : null

  return (
    <main>
      {faqSchema && <JsonLd data={faqSchema} nonce={nonce} />}
      <PageHero
        eyebrow={dict.pages.eyebrow_support}
        title={dict.pages.faq_title}
        summary={dict.pages.faq_summary}
      />
      <section className="page-section">
        <div className="container stack-lg">
          {faqs.length ? (
            faqs.map((faq: any) => (
              <details key={faq.id} className="card">
                <summary><strong>{faq.question}</strong></summary>
                <p>{faq.answer}</p>
              </details>
            ))
          ) : (
            <article className="card">
              <p>{dict.pages.no_faqs}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
