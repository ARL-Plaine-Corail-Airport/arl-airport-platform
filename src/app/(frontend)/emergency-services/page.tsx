import { DetailCards } from '@/components/ui/detail-cards'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { formatDateTime } from '@/lib/date'
import { getEmergencyServices } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'
import { splitParagraphs } from '@/lib/text'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.emergency_title} - ${dict.common.airport_location}`,
    description: dict.pages.emergency_summary,
    path: '/emergency-services',
  })
}

export default async function EmergencyServicesPage() {
  const locale = await getLocale()
  const [dict, data] = await Promise.all([getDictionary(locale), getEmergencyServices(locale)])
  const contactCards = (data.serviceContacts || []).map((contact) => ({
    title: contact.serviceName,
    value: [contact.phone, contact.description, contact.available24h ? '24/7' : null]
      .filter(Boolean)
      .join(' Â· '),
    link: contact.phone ? `tel:${contact.phone}` : undefined,
  }))

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_emergency}
        title={data.pageTitle ?? dict.pages.emergency_title}
        summary={data.introduction ?? dict.pages.emergency_summary}
      />

      <section className="page-section">
        <div className="container stack-lg">
          <article className="card stack-sm">
            <h2>{dict.pages.primary_emergency_number}</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.primaryEmergencyNumber}</p>
            {(data.lastVerifiedDate || data.verifiedBy) && (
              <p className="meta">
                {dict.labels.verified} {data.lastVerifiedDate ? formatDateTime(data.lastVerifiedDate, locale) : dict.labels.recently}
                {data.verifiedBy ? ` ${dict.labels.by} ${data.verifiedBy}` : ''}
              </p>
            )}
          </article>

          <div>
            <h2 style={{ marginBottom: '1rem' }}>{dict.pages.emergency_contacts}</h2>
            <DetailCards items={contactCards} />
          </div>

          {data.medicalFacilities && (
            <article className="card stack-sm">
              <h2>{dict.pages.medical_facilities}</h2>
              {splitParagraphs(data.medicalFacilities).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          )}

          {data.evacuationProcedures && (
            <article className="card stack-sm">
              <h2>{dict.pages.emergency_procedures}</h2>
              {splitParagraphs(data.evacuationProcedures).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          )}
        </div>
      </section>
    </main>
  )
}
