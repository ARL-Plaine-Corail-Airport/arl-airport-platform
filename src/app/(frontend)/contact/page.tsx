import { DetailCards } from '@/components/ui/detail-cards'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getContactInfo, getSiteSettings } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.contact_title} - ${dict.common.airport_location}`,
    description: dict.pages.contact_summary,
    path: '/contact',
  })
}

export default async function ContactPage() {
  const locale = await getLocale()
  const [dict, contact, site] = await Promise.all([
    getDictionary(locale),
    getContactInfo(locale),
    getSiteSettings(locale),
  ])

  const cards = [
    ...(contact.cards || []),
    {
      title: dict.pages.primary_phone,
      value: site.primaryPhone,
      link: site.primaryPhone ? `tel:${site.primaryPhone.replace(/\s/g, '')}` : undefined,
    },
    {
      title: dict.pages.primary_email,
      value: site.primaryEmail,
      link: site.primaryEmail ? `mailto:${site.primaryEmail}` : undefined,
    },
    {
      title: dict.pages.address,
      value: site.physicalAddress,
      link: site.physicalAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.physicalAddress)}`
        : undefined,
    },
  ]

  return (
    <main>
      <PageHero eyebrow={dict.pages.eyebrow_support} title={contact.helpDeskTitle} summary={contact.helpDeskSummary} />
      <section className="page-section">
        <div className="container">
          <DetailCards items={cards} />
        </div>
      </section>
    </main>
  )
}
