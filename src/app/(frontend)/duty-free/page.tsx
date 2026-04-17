import Image from 'next/image'
import Link from 'next/link'

import { ProtectedImageFrame } from '@/components/ui/protected-image-frame'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { buildFrontendMetadata } from '@/lib/metadata'

import { dutyFreeContacts } from './contact-details'

export const revalidate = 300

const dutyFreeImages = [
  {
    altKey: 'retail_1',
    src: '/images/duty-free/duty-free-1.jpg',
  },
  {
    altKey: 'retail_2',
    src: '/images/duty-free/duty-free-2.jpeg',
  },
  {
    altKey: 'retail_3',
    src: '/images/duty-free/duty-free-3.jpeg',
  },
] as const

const cafeImages = [
  {
    altKey: 'cafe_1',
    src: '/images/duty-free/duty-freecafe-1.jpeg',
  },
  {
    altKey: 'cafe_2',
    src: '/images/duty-free/duty-freecafe-2.jpeg',
  },
  {
    altKey: 'cafe_3',
    src: '/images/duty-free/duty-freecafe-3.jpeg',
  },
] as const

export async function generateMetadata() {
  try {
    const locale = await getLocale()
    const dict = await getDictionary(locale)

    return buildFrontendMetadata({
      description: dict.duty_free.summary,
      locale,
      path: '/duty-free',
      title: `${dict.duty_free.title} - ${dict.common.airport_location}`,
    })
  } catch {
    return { title: 'ARL Airport' }
  }
}

function SparkIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function CallIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function CupIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" />
      <path d="M6 1v3" />
      <path d="M10 1v3" />
      <path d="M14 1v3" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  )
}

const highlightIcons = [SparkIcon, ClockIcon, CallIcon]

export default async function DutyFreePage() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const d = dict.duty_free

  return (
    <main>
      <PageHero eyebrow={d.eyebrow} title={d.title} summary={d.summary} />

      <section className="page-section df-intro">
        <div className="container">
          <div className="df-highlights" role="list">
            {d.highlights.map((card, index) => {
              const Icon = highlightIcons[index]

              return (
                <article key={card.title} className="df-highlight" role="listitem">
                  <div className="df-highlight__icon">
                    <Icon />
                  </div>
                  <p className="df-highlight__eyebrow">{card.eyebrow}</p>
                  <h2 className="df-highlight__title">{card.title}</h2>
                  <p className="df-highlight__body">{card.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="page-section df-stage">
        <div className="container">
          <div className="df-stage__grid">
            <div className="df-stage__media">
              <ProtectedImageFrame as="figure" className="df-stage__lead">
                <Image
                  src={dutyFreeImages[0].src}
                  alt={d.images[dutyFreeImages[0].altKey]}
                  width={1200}
                  height={900}
                  sizes="(max-width: 1023px) 100vw, 58vw"
                  className="df-stage__image"
                  draggable={false}
                  priority
                />
              </ProtectedImageFrame>

              <ProtectedImageFrame as="figure" className="df-stage__support">
                <Image
                  src={dutyFreeImages[1].src}
                  alt={d.images[dutyFreeImages[1].altKey]}
                  width={900}
                  height={620}
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 76vw, 30vw"
                  className="df-stage__image"
                  draggable={false}
                />
                <figcaption className="df-stage__support-copy">
                  <p className="df-stage__support-label">{d.retail.eyebrow}</p>
                  <p className="df-stage__support-meta">{d.retail.access}</p>
                </figcaption>
              </ProtectedImageFrame>
            </div>

            <article className="df-stage__card">
              <p className="df-kicker">{d.retail.eyebrow}</p>
              <h2 className="df-stage__title">{d.retail.title}</h2>
              <p className="df-stage__summary">{d.retail.body}</p>

              <ul className="df-facts" aria-label={d.retail.title}>
                {d.retail.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>

              <div className="df-meta-strip">
                <span className="df-chip">{d.retail.access}</span>
                <span className="df-chip">{d.retail.schedule}</span>
                <span className="df-chip">{d.retail.contact_availability}</span>
              </div>

              <address className="df-contact-card">
                <p className="df-contact-card__label">{d.contact_label}</p>
                <p className="df-contact-card__name">{dutyFreeContacts.retail.name}</p>
                <p>{dutyFreeContacts.retail.address}</p>

                <div className="df-action-row">
                  <a href={`tel:${dutyFreeContacts.retail.phone}`} className="df-action">
                    <CallIcon />
                    <span>{d.retail.call_cta}</span>
                  </a>
                  <a href={`mailto:${dutyFreeContacts.retail.email}`} className="df-action df-action--ghost">
                    <MailIcon />
                    <span>{d.retail.email_cta}</span>
                  </a>
                </div>
              </address>
            </article>
          </div>
        </div>
      </section>

      <section className="page-section df-storyband">
        <div className="container df-story-stack">
          <article className="df-story">
            <div className="df-story__display">
              <ProtectedImageFrame as="figure" className="df-story__image-frame">
                <Image
                  src={dutyFreeImages[2].src}
                  alt={d.images[dutyFreeImages[2].altKey]}
                  width={1000}
                  height={720}
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 88vw, 44vw"
                  className="df-stage__image"
                  draggable={false}
                />
                <figcaption className="df-story__overlay">{d.bookshop.overlay}</figcaption>
              </ProtectedImageFrame>

              <div className="df-story__display-card">
                <div className="df-story__display-head">
                  <span className="df-story__display-icon">
                    <BookIcon />
                  </span>
                  <div>
                    <p className="df-kicker">{d.bookshop.eyebrow}</p>
                    <h2 className="df-story__title">{d.bookshop.title}</h2>
                  </div>
                </div>

                <div className="df-meta-strip">
                  <span className="df-chip">{d.bookshop.access}</span>
                </div>

                <ul className="df-mini-list">
                  {d.bookshop.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="df-story__content">
              <div className="df-copy-block">
                <p>{d.bookshop.body_1}</p>
                <p>{d.bookshop.body_2}</p>
              </div>

              <address className="df-contact-card df-contact-card--soft">
                <p className="df-contact-card__label">{d.contact_label}</p>
                <p className="df-contact-card__name">{dutyFreeContacts.bookshop.name}</p>
                <p>{dutyFreeContacts.bookshop.address}</p>

                <div className="df-action-row">
                  <a href={`tel:${dutyFreeContacts.bookshop.phone}`} className="df-action">
                    <CallIcon />
                    <span>{d.bookshop.call_cta}</span>
                  </a>
                  <a href={`mailto:${dutyFreeContacts.bookshop.email}`} className="df-action df-action--ghost">
                    <MailIcon />
                    <span>{d.bookshop.email_cta}</span>
                  </a>
                </div>
              </address>
            </div>
          </article>

          <article className="df-story df-story--reverse">
            <div className="df-story__content">
              <p className="df-kicker">{d.cafe.eyebrow}</p>
              <h2 className="df-story__title">{d.cafe.title}</h2>

              <div className="df-copy-block">
                <p>{d.cafe.body}</p>
              </div>

              <div className="df-meta-strip">
                <span className="df-chip">{d.cafe.access}</span>
                <span className="df-chip">{d.retail.schedule}</span>
              </div>

              <ul className="df-mini-list df-mini-list--warm">
                {d.cafe.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="df-story__display df-story__display--gallery">
              <div className="df-story__display-head">
                <span className="df-story__display-icon df-story__display-icon--amber">
                  <CupIcon />
                </span>
                <div>
                  <p className="df-kicker">{d.cafe.eyebrow}</p>
                  <h2 className="df-story__title">{d.cafe.title}</h2>
                </div>
              </div>

              <div className="df-gallery-strip" aria-label={d.cafe.title}>
                {cafeImages.map((image) => (
                  <ProtectedImageFrame key={image.src} as="figure" className="df-gallery-strip__item">
                    <Image
                      src={image.src}
                      alt={d.images[image.altKey]}
                      width={900}
                      height={680}
                      sizes="(max-width: 767px) 78vw, (max-width: 1023px) 46vw, 24vw"
                      className="df-stage__image"
                      draggable={false}
                    />
                  </ProtectedImageFrame>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="page-section df-return">
        <div className="container">
          <div className="df-return__card">
            <div>
              <p className="df-kicker">{d.eyebrow}</p>
              <h2 className="df-return__title">{d.return.title}</h2>
              <p className="df-return__summary">{d.return.summary}</p>
            </div>

            <Link href={localePath('/passenger-guide', locale)} className="df-return__link">
              <span>{d.back_to_guide}</span>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
