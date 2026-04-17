import { DetailCards } from '@/components/ui/detail-cards'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getContactInfo, getSiteSettings } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

export const revalidate = 300

function normalizePhone(value?: string | null) {
  if (!value) return null

  const cleaned = value.trim().replace(/[^\d+]/g, '')
  if (!cleaned) return null
  if (!cleaned.startsWith('+')) return cleaned.replace(/\+/g, '')

  return `+${cleaned.slice(1).replace(/\+/g, '')}`
}

function normalizeEmail(value?: string | null) {
  const cleaned = value?.trim().toLowerCase()
  return cleaned || null
}

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)
    return buildFrontendMetadata({
      locale,
      title: `${dict.pages.contact_title} - ${dict.common.airport_location}`,
      description: dict.pages.contact_summary,
      path: '/contact',
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

export default async function ContactPage() {
  const locale = await getLocale()
  const [dict, contact, site] = await Promise.all([
    getDictionary(locale),
    getContactInfo(locale),
    getSiteSettings(locale),
  ])
  const contactCards = contact.cards || []
  const primaryPhone = normalizePhone(site.primaryPhone)
  const primaryEmail = normalizeEmail(site.primaryEmail)
  const physicalAddress = site.physicalAddress?.trim()

  const hasPrimaryPhoneCard = primaryPhone
    ? contactCards.some((card) => {
        const linkPhone = card.link?.startsWith('tel:') ? normalizePhone(card.link.slice(4)) : null
        return normalizePhone(card.value) === primaryPhone || linkPhone === primaryPhone
      })
    : false

  const hasPrimaryEmailCard = primaryEmail
    ? contactCards.some((card) => {
        const linkEmail = card.link?.startsWith('mailto:') ? normalizeEmail(card.link.slice(7)) : null
        return normalizeEmail(card.value) === primaryEmail || linkEmail === primaryEmail
      })
    : false

  const hasAddressCard = physicalAddress
    ? contactCards.some((card) => card.value?.trim().toLowerCase() === physicalAddress.toLowerCase())
    : false

  const cards = [
    ...contactCards.map((card) => ({
      ...card,
      id: card.id ?? `contact-${card.title}-${card.value}`,
    })),
    ...(!hasPrimaryPhoneCard && site.primaryPhone
      ? [{
          id: 'site-primary-phone',
          title: dict.pages.primary_phone,
          value: site.primaryPhone,
          link: `tel:${site.primaryPhone.replace(/\s/g, '')}`,
        }]
      : []),
    ...(!hasPrimaryEmailCard && site.primaryEmail
      ? [{
          id: 'site-primary-email',
          title: dict.pages.primary_email,
          value: site.primaryEmail,
          link: `mailto:${site.primaryEmail}`,
        }]
      : []),
    ...(!hasAddressCard && site.physicalAddress
      ? [{
          id: 'site-physical-address',
          title: dict.pages.address,
          value: site.physicalAddress,
          link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.physicalAddress)}`,
        }]
      : []),
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
