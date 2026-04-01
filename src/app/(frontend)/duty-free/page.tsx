import Image from 'next/image'
import Link from 'next/link'

import { ProtectedImageFrame } from '@/components/ui/protected-image-frame'
import { PageHero } from '@/components/ui/page-hero'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { buildFrontendMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  return buildFrontendMetadata({
    locale,
    title: `${dict.pages.duty_free_title} - ${dict.common.airport_location}`,
    description: dict.pages.duty_free_summary,
    path: '/duty-free',
  })
}

type HighlightCard = {
  eyebrow: string
  title: string
  body: string
}

type DutyFreeCopy = {
  highlights: HighlightCard[]
  retailEyebrow: string
  retailFacts: string[]
  retailSchedule: string
  retailAccess: string
  contactAvailability: string
  callDutyFree: string
  emailDutyFree: string
  bookshopEyebrow: string
  bookshopOverlay: string
  bookshopHighlights: string[]
  departureOnly: string
  callBookshop: string
  emailBookshop: string
  cafeEyebrow: string
  cafeHighlights: string[]
  cafeAccess: string
  returnTitle: string
  returnSummary: string
}

const dutyFreeImages = [
  {
    src: '/images/duty-free/duty-free-1.jpg',
    alt: 'Duty free arrivals storefront at Plaine Corail Airport',
  },
  {
    src: '/images/duty-free/duty-free-2.jpeg',
    alt: 'Duty free arrivals retail floor at Plaine Corail Airport',
  },
  {
    src: '/images/duty-free/duty-free-3.jpeg',
    alt: 'Departure-side duty free retail interior at Plaine Corail Airport',
  },
]

const cafeImages = [
  {
    src: '/images/duty-free/duty-freecafe-1.jpeg',
    alt: 'Kafe Solitaire counter and seating area',
  },
  {
    src: '/images/duty-free/duty-freecafe-2.jpeg',
    alt: 'Kafe Solitaire service counter',
  },
  {
    src: '/images/duty-free/duty-freecafe-3.jpeg',
    alt: 'Kafe Solitaire seating area near the concourse',
  },
]

function getDutyFreeCopy(locale: string): DutyFreeCopy {
  switch (locale) {
    case 'fr':
      return {
        highlights: [
          {
            eyebrow: 'Acces passagers',
            title: 'Accessible aux arrivees et aux departs',
            body: "L'offre commerciale accompagne les deux flux de passagers dans l'aerogare.",
          },
          {
            eyebrow: 'Horaires',
            title: 'Calques sur le programme de vols',
            body: "Les heures d'ouverture suivent le programme de vols publie et l'activite du terminal.",
          },
          {
            eyebrow: 'Contact',
            title: 'Assistance directe disponible',
            body: 'Telephone et courriel restent disponibles pour les demandes passagers et produits.',
          },
        ],
        retailEyebrow: 'Shopping aeroportuaire',
        retailFacts: [
          'Parfums, cosmetiques, spiritueux, chocolats et articles de voyage.',
          'Concu pour les passagers a l arrivee comme au depart.',
          'Selection elargie pour une experience d achat plus fluide.',
        ],
        retailSchedule: 'Horaires selon le programme de vols publie',
        retailAccess: 'Arrivees et departs',
        contactAvailability: 'Contact direct disponible',
        callDutyFree: 'Appeler la boutique',
        emailDutyFree: 'Envoyer un courriel',
        bookshopEyebrow: 'Zone depart',
        bookshopOverlay: 'Ambiance retail cote depart',
        bookshopHighlights: [
          'Livres, magazines, romans et souvenirs de Rodrigues.',
          'Point de pause avec boissons chaudes, boissons froides et snacks.',
        ],
        departureOnly: 'Accessible aux passagers au depart uniquement',
        callBookshop: 'Appeler la librairie',
        emailBookshop: 'Ecrire a la librairie',
        cafeEyebrow: 'Restauration terminal',
        cafeHighlights: [
          'Boissons froides et chaudes.',
          'Repas chauds, viennoiseries, sandwichs et en-cas.',
          'Service pour voyageurs et visiteurs de l aeroport.',
        ],
        cafeAccess: 'Hall des departs et concourse public',
        returnTitle: 'Continuer vers les services passagers',
        returnSummary: 'Retrouvez les autres services aeroportuaires, facilites et informations utiles pour le voyage.',
      }
    case 'mfe':
      return {
        highlights: [
          {
            eyebrow: 'Akses pasaze',
            title: 'Pou arive ek pou depar',
            body: 'Boutik ek servis disponib pou toulede mouvman pasaze dan terminal.',
          },
          {
            eyebrow: 'Ler louvertir',
            title: 'Swiv program vol pibliye',
            body: 'Ler servis adapte ar aktivite terminal ek program vol Lasanble zour.',
          },
          {
            eyebrow: 'Kontak',
            title: 'Led direk disponib',
            body: 'Telefon ek imel reste disponib pou kestyon lor prodwi ek servis.',
          },
        ],
        retailEyebrow: 'Boutik ayropor',
        retailFacts: [
          'Parfen, kosmetik, lalkol, sokola ek lezot lartik vwayaz.',
          'Aksesib pou pasaze arive kouma pasaze depar.',
          'Enn seleksyon pli larz pou enn lexperyans shopping pli konfrotab.',
        ],
        retailSchedule: 'Ler louvertir dapre program vol pibliye',
        retailAccess: 'Arive ek depar',
        contactAvailability: 'Kontak direk disponib',
        callDutyFree: 'Telefon duty free',
        emailDutyFree: 'Avoy enn imel',
        bookshopEyebrow: 'Lazonn depar',
        bookshopOverlay: 'Lanmbyans retail dan lazonn depar',
        bookshopHighlights: [
          'Liv, magazinn, roman ek souvenir Rodrigues.',
          'Bwason so, bwason fre ek ti keksoz pou manze avan depar.',
        ],
        departureOnly: 'Rezerv pou pasaze depar selman',
        callBookshop: 'Telefon libreri',
        emailBookshop: 'Imel libreri',
        cafeEyebrow: 'Manze ek bwason',
        cafeHighlights: [
          'Bwason so ek fre.',
          'Repa, gato, sandwich ek keksoz sek.',
          'Servis pou pasaze ek viziter ayropor.',
        ],
        cafeAccess: 'Sal depar ek konkours piblik',
        returnTitle: 'Kontignn ver gid pasaze',
        returnSummary: 'Get lezot servis ayropor, fasilite ek lenformasyon itil pou prepar ou deplasman.',
      }
    default:
      return {
        highlights: [
          {
            eyebrow: 'Passenger access',
            title: 'Available for arrivals and departures',
            body: 'Retail and refreshment services support both passenger flows through the terminal.',
          },
          {
            eyebrow: 'Operating hours',
            title: 'Aligned with the published flight schedule',
            body: 'Trading hours follow the active flight programme rather than fixed retail hours.',
          },
          {
            eyebrow: 'Contact support',
            title: 'Direct operator contact remains available',
            body: 'Passengers can reach operators by phone or email for service and product information.',
          },
        ],
        retailEyebrow: 'Airport retail',
        retailFacts: [
          'Travel retail with fragrances, cosmetics, wines, spirits, chocolates, and electronics.',
          'Available to both arriving and departing passengers at Plaine Corail Airport.',
          'Expanded retail environment designed for smoother passenger browsing.',
        ],
        retailSchedule: 'Opening hours follow the published flight schedule',
        retailAccess: 'Arrivals and departures',
        contactAvailability: 'Direct contact available',
        callDutyFree: 'Call duty free',
        emailDutyFree: 'Email duty free',
        bookshopEyebrow: 'Departure zone',
        bookshopOverlay: 'Retail atmosphere in the departure zone',
        bookshopHighlights: [
          'Books, magazines, novels, Rodrigues titles, and souvenir items.',
          'Refreshments, hot drinks, cold drinks, and light snacks before boarding.',
        ],
        departureOnly: 'Accessible to departing passengers only',
        callBookshop: 'Call bookshop',
        emailBookshop: 'Email bookshop',
        cafeEyebrow: 'Food and refreshments',
        cafeHighlights: [
          'Cold and hot drinks throughout the day.',
          'Hot meals, pastries, sandwiches, and dry foods.',
          'Available for both passengers and airport visitors.',
        ],
        cafeAccess: 'Departure hall and public concourse',
        returnTitle: 'Continue through passenger services',
        returnSummary: 'Explore the wider passenger guide for airport facilities, movement, and service information.',
      }
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
  const d = dict.pages
  const ui = getDutyFreeCopy(locale)

  return (
    <main>
      <PageHero
        eyebrow={d.eyebrow_passenger_info}
        title={d.duty_free_title}
        summary={d.duty_free_summary}
      />

      <section className="page-section df-intro">
        <div className="container">
          <div className="df-highlights" role="list">
            {ui.highlights.map((card, index) => {
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
                  alt={dutyFreeImages[0].alt}
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
                  alt={dutyFreeImages[1].alt}
                  width={900}
                  height={620}
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 76vw, 30vw"
                  className="df-stage__image"
                  draggable={false}
                />
                <figcaption className="df-stage__support-copy">
                  <p className="df-stage__support-label">{ui.retailEyebrow}</p>
                  <p className="df-stage__support-meta">{ui.retailAccess}</p>
                </figcaption>
              </ProtectedImageFrame>
            </div>

            <article className="df-stage__card">
              <p className="df-kicker">{ui.retailEyebrow}</p>
              <h2 className="df-stage__title">{d.duty_free_shopping}</h2>
              <p className="df-stage__summary">{d.duty_free_body}</p>

              <ul className="df-facts" aria-label={d.duty_free_shopping}>
                {ui.retailFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>

              <div className="df-meta-strip">
                <span className="df-chip">{ui.retailAccess}</span>
                <span className="df-chip">{ui.retailSchedule}</span>
                <span className="df-chip">{ui.contactAvailability}</span>
              </div>

              <address className="df-contact-card">
                <p className="df-contact-card__label">{d.contact_label}</p>
                <p className="df-contact-card__name">Rodrigues Duty Free Paradise Ltd</p>
                <p>Plaine Corail Airport, Plaine Corail, Rodrigues</p>

                <div className="df-action-row">
                  <a href="tel:+2308327566" className="df-action">
                    <CallIcon />
                    <span>{ui.callDutyFree}</span>
                  </a>
                  <a href="mailto:rdpf08@intnet.mu" className="df-action df-action--ghost">
                    <MailIcon />
                    <span>{ui.emailDutyFree}</span>
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
                  alt={dutyFreeImages[2].alt}
                  width={1000}
                  height={720}
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 88vw, 44vw"
                  className="df-stage__image"
                  draggable={false}
                />
                <figcaption className="df-story__overlay">{ui.bookshopOverlay}</figcaption>
              </ProtectedImageFrame>

              <div className="df-story__display-card">
                <div className="df-story__display-head">
                  <span className="df-story__display-icon">
                    <BookIcon />
                  </span>
                  <div>
                    <p className="df-kicker">{ui.bookshopEyebrow}</p>
                    <h2 className="df-story__title">{d.bookshop_title}</h2>
                  </div>
                </div>

                <div className="df-meta-strip">
                  <span className="df-chip">{ui.departureOnly}</span>
                </div>

                <ul className="df-mini-list">
                  {ui.bookshopHighlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="df-story__content">
              <div className="df-copy-block">
                <p>{d.bookshop_body_1}</p>
                <p>{d.bookshop_body_2}</p>
              </div>

              <address className="df-contact-card df-contact-card--soft">
                <p className="df-contact-card__label">{d.contact_label}</p>
                <p className="df-contact-card__name">Island Books &amp; Clothes</p>
                <p>Port Mathurin, Rodrigues</p>

                <div className="df-action-row">
                  <a href="tel:+2308321564" className="df-action">
                    <CallIcon />
                    <span>{ui.callBookshop}</span>
                  </a>
                  <a href="mailto:islandbkspot@gmail.com" className="df-action df-action--ghost">
                    <MailIcon />
                    <span>{ui.emailBookshop}</span>
                  </a>
                </div>
              </address>
            </div>
          </article>

          <article className="df-story df-story--reverse">
            <div className="df-story__content">
              <p className="df-kicker">{ui.cafeEyebrow}</p>
              <h2 className="df-story__title">{d.food_counter_title}</h2>

              <div className="df-copy-block">
                <p>{d.food_counter_body}</p>
              </div>

              <div className="df-meta-strip">
                <span className="df-chip">{ui.cafeAccess}</span>
                <span className="df-chip">{ui.retailSchedule}</span>
              </div>

              <ul className="df-mini-list df-mini-list--warm">
                {ui.cafeHighlights.map((item) => (
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
                  <p className="df-kicker">{ui.cafeEyebrow}</p>
                  <h2 className="df-story__title">{d.food_counter_title}</h2>
                </div>
              </div>

              <div className="df-gallery-strip" aria-label={d.food_counter_title}>
                {cafeImages.map((image) => (
                  <ProtectedImageFrame key={image.src} as="figure" className="df-gallery-strip__item">
                    <Image
                      src={image.src}
                      alt={image.alt}
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
              <p className="df-kicker">{d.eyebrow_passenger_info}</p>
              <h2 className="df-return__title">{ui.returnTitle}</h2>
              <p className="df-return__summary">{ui.returnSummary}</p>
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
