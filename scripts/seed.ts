import config from '@payload-config'
import { getPayload } from 'payload'

/** Convert a plain text string into Lexical richText JSON with paragraph nodes. */
function richText(text: string) {
  const paragraphs = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean)
  return {
    root: {
      type: 'root',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        children: [{ type: 'text', text: p, version: 1 }],
        direction: null,
        format: '' as const,
        indent: 0,
        version: 1,
      })),
      direction: null,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

const pageSections = [
  {
    heading: 'Replace with approved institutional copy',
    body: richText(
      'This starter page is intentionally editorial-safe. Replace this text with approved airport content before production launch.\n\nUse short paragraphs, clear passenger language, and link to official documents where relevant.',
    ),
    bullets: [{ text: 'Review language quality in English and French.' }],
  },
]

async function upsertBySlug(payload: any, collection: string, slug: string, data: Record<string, unknown>) {
  try {
    const existing = await payload.find({
      collection,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    if (existing.docs[0]) {
      return await payload.update({
        collection,
        id: existing.docs[0].id,
        data,
      })
    }

    return await payload.create({
      collection,
      data,
    })
  } catch (error) {
    console.error(`[seed] Failed to upsert ${collection} slug="${slug}":`, error)
    throw error
  }
}

async function deleteBySlug(payload: any, collection: string, slug: string) {
  const existing = await payload.find({
    collection,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (!existing.docs[0]) return null

  return payload.delete({
    collection,
    id: existing.docs[0].id,
  })
}

async function ensureInitialSuperAdmin(payload: any) {
  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    where: {
      roles: {
        contains: 'super_admin',
      },
    },
  })

  if (existing.docs[0]) {
    console.log('[seed] Super admin already exists.')
    return
  }

  const email = process.env.INITIAL_ADMIN_EMAIL
  const password = process.env.INITIAL_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      '[seed] No super_admin user exists. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD before seeding.',
    )
  }

  await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      fullName: 'Initial Super Admin',
      roles: ['super_admin'],
      mfaRequired: true,
    },
  })

  console.log(`[seed] Created initial super admin: ${email}`)
}

async function updateGlobalWithLogging(
  payload: any,
  slug: string,
  data: Record<string, unknown>,
  failures: string[],
) {
  try {
    await payload.updateGlobal({
      slug,
      data,
    })
    console.log(`[seed] Updated global: ${slug}`)
  } catch (error) {
    failures.push(slug)
    console.error(`[seed] Failed to update global: ${slug}`, error)
  }
}

async function main() {
  const payload = await getPayload({ config })
  const failedGlobalUpdates: string[] = []

  await ensureInitialSuperAdmin(payload)

  await updateGlobalWithLogging(payload, 'site-settings', {
      siteName: 'Airport of Rodrigues Ltd',
      airportName: 'Plaine Corail Airport',
      tagline:
        'Official passenger information platform for operational notices, flight information, passenger guidance, and mobile-first access.',
      primaryPhone: '+230 832 78 88',
      primaryEmail: 'info@arl.aero',
      physicalAddress: 'Plaine Corail Airport, Rodrigues Island, Republic of Mauritius',
      workingHours: 'Consult official notices and airline information for operational variations.',
      usefulLinks: [
        { label: 'Airline information', url: '/airlines' },
        { label: 'Transport and parking', url: '/transport-parking' },
      ],
    },
  failedGlobalUpdates)

  await updateGlobalWithLogging(payload, 'home-page', {
      heroTitle: 'Official passenger information for Plaine Corail Airport',
      heroSummary:
        'Check arrivals and departures, read official communiqués, prepare your journey, and access transport, accessibility, and contact information from one mobile-first platform.',
      servicesPreview: [
        { title: 'Passenger guide', summary: 'Check-in, baggage, security, and preparation guidance.' },
        { title: 'Official notices', summary: 'Operational communiqués, advisories, and documents.' },
        { title: 'Transport and parking', summary: 'Pickup, drop-off, direction, and access information.' },
      ],
    },
  failedGlobalUpdates)

  await updateGlobalWithLogging(payload, 'passenger-guide', {
      introTitle: 'Prepare for your journey',
      introSummary:
        'Use this guide to review check-in, baggage, security, and airport support information before travelling.',
      sections: [
        {
          heading: 'Before you travel',
          body: richText(
            'Confirm your flight details with your airline before leaving for the airport.\n\nPrepare travel documents and arrive with enough time for check-in and security procedures.',
          ),
          bullets: [
            { text: 'Keep your travel documents readily accessible.' },
            { text: 'Review airline baggage rules before travel day.' },
          ],
        },
        {
          heading: 'At the terminal',
          body: richText(
            'Follow airport signage and staff instructions.\n\nUse official communication channels for disruptions or schedule changes.',
          ),
        },
      ],
      importantContacts: [
        { label: 'Airport help desk', value: '+230 832 78 88' },
        { label: 'General email', value: 'info@arl.aero' },
      ],
    },
  failedGlobalUpdates)

  await updateGlobalWithLogging(payload, 'transport-parking', {
      introTitle: 'Transport and parking information',
      introSummary:
        'Plan your journey to and from Plaine Corail Airport. Review taxi, bus, drop-off, pickup, and parking information.',
      sections: [
        {
          heading: 'Getting to the airport',
          body: richText(
            'Plaine Corail Airport is located approximately 15 km southwest of Port Mathurin, about a 25-minute drive via the main road.\n\nThe airport is well signposted from Port Mathurin and other main villages across Rodrigues. Follow signs for "Aéroport / Airport" from the coastal road.',
          ),
          bullets: [
            { text: 'Distance from Port Mathurin: approximately 15 km' },
            { text: 'Driving time: approximately 25 minutes' },
            { text: 'Follow signage from the main coastal road' },
          ],
        },
        {
          heading: 'Taxis',
          body: richText(
            'Licensed taxis are available at the official taxi rank near the arrivals exit. Taxis serve all destinations on the island.\n\nFares are not metered — agree on the fare with the driver before departure. Approximate fares from the airport: Port Mathurin Rs 600–800, Anse Aux Anglais Rs 700–900, Gravier / Pointe Cotton Rs 800–1000.',
          ),
          bullets: [
            { text: 'Taxi rank located at the arrivals exit' },
            { text: 'Agree on the fare before departure' },
            { text: 'Available for all destinations on Rodrigues' },
          ],
        },
        {
          heading: 'Public bus',
          body: richText(
            'A public bus stop is located on the main road near the airport entrance. Bus routes connect the airport area to Port Mathurin and other villages.\n\nBus services run during daytime hours. Frequency varies and services may not be timed to flight arrivals. For time-sensitive transfers, a taxi is recommended.',
          ),
          bullets: [
            { text: 'Bus stop on the main road near the airport gate' },
            { text: 'Routes to Port Mathurin and surrounding areas' },
            { text: 'Limited frequency — plan ahead' },
          ],
        },
        {
          heading: 'Drop-off and pickup',
          body: richText(
            'A designated drop-off and pickup zone is located directly in front of the terminal building. This area is for short stops only.\n\nDo not leave vehicles unattended in the drop-off zone. Drivers waiting for arriving passengers should use the passenger car park.',
          ),
          bullets: [
            { text: 'Short-stay only — no unattended vehicles' },
            { text: 'Located directly in front of the terminal entrance' },
            { text: 'Waiting drivers should use the car park' },
          ],
        },
        {
          heading: 'Parking',
          body: richText(
            'The passenger car park is located adjacent to the terminal building with short-stay and long-stay bays. The car park is open during airport operational hours.\n\nParking is available on a first-come, first-served basis. During peak travel periods, arrive early to secure a space.',
          ),
          bullets: [
            { text: 'Adjacent to the terminal building' },
            { text: 'Short-stay and long-stay bays available' },
            { text: 'Open during airport operational hours' },
            { text: 'First-come, first-served — arrive early during peak periods' },
          ],
        },
        {
          heading: 'Car hire',
          body: richText(
            'Car hire operators are available on Rodrigues. Some operators offer airport pickup and drop-off by arrangement.\n\nBook in advance through your accommodation or directly with a licensed operator. Vehicles drive on the left in Mauritius and Rodrigues.',
          ),
          bullets: [
            { text: 'Arrange airport pickup in advance with your hire company' },
            { text: 'Driving is on the left' },
            { text: 'A valid driving licence is required' },
          ],
        },
      ],
    },
  failedGlobalUpdates)

  await updateGlobalWithLogging(payload, 'accessibility-info', {
      introTitle: 'Accessibility support',
      introSummary:
        'Passengers requiring assistance should coordinate with their airline and the airport help desk ahead of travel when possible.',
      sections: [
        {
          heading: 'Reduced mobility assistance',
          body: richText(
            'Provide advance notice where possible to ensure the right support is available.\n\nAirport editors should maintain approved details for accessible paths, parking, and facilities.',
          ),
        },
      ],
      assistanceContact: 'Contact the airport help desk and your airline before travel where possible.',
    },
  failedGlobalUpdates)

  await updateGlobalWithLogging(payload, 'airport-map', {
      introTitle: 'Airport map and key points',
      introSummary:
        'Locate the terminal building, car park, pickup and drop-off zones, and other essential wayfinding points at Plaine Corail Airport.',
      points: [
        {
          name: 'Terminal Building',
          category: 'terminal',
          description: 'Main passenger terminal with check-in counters, departure lounge, arrival hall, immigration, and customs.',
          lat: -19.75420,
          lng: 63.35830,
        },
        {
          name: 'Departure Hall Entrance',
          category: 'terminal',
          description: 'Main entrance for departing passengers. Check-in counters and airline desks are located on the ground floor.',
          lat: -19.75395,
          lng: 63.35783,
        },
        {
          name: 'Arrivals Exit',
          category: 'terminal',
          description: 'Exit point for arriving passengers after baggage claim and customs clearance.',
          lat: -19.75435,
          lng: 63.35870,
        },
        {
          name: 'Passenger Car Park',
          category: 'parking',
          description: 'Main parking area for passengers and visitors. Short-stay and long-stay bays available.',
          lat: -19.75345,
          lng: 63.35830,
        },
        {
          name: 'Staff Car Park',
          category: 'parking',
          description: 'Reserved parking for airport staff and authorised personnel.',
          lat: -19.75615,
          lng: 63.36010,
        },
        {
          name: 'Drop-off / Pickup Zone',
          category: 'transport',
          description: 'Designated short-stay area directly in front of the terminal for passenger drop-off and pickup. No unattended vehicles.',
          lat: -19.75380,
          lng: 63.35790,
        },
        {
          name: 'Taxi Rank',
          category: 'transport',
          description: 'Official taxi stand located near the arrivals exit. Licensed taxis are available for all destinations on Rodrigues.',
          lat: -19.75450,
          lng: 63.35890,
        },
        {
          name: 'Bus Stop',
          category: 'transport',
          description: 'Public bus stop on the main road near the airport entrance. Routes connect to Port Mathurin and other villages.',
          lat: -19.75320,
          lng: 63.35910,
        },
        {
          name: 'Accessible Entrance & Ramp',
          category: 'accessibility',
          description: 'Step-free access ramp leading to the terminal. Wheelchair assistance available on request at the help desk.',
          lat: -19.75405,
          lng: 63.35790,
        },
        {
          name: 'Security Checkpoint',
          category: 'security',
          description: 'Passenger and cabin baggage screening area. Remove electronics and liquids before entering.',
          lat: -19.75430,
          lng: 63.35840,
        },
        {
          name: 'Immigration & Customs',
          category: 'security',
          description: 'Passport control and customs declarations for arriving and departing international passengers.',
          lat: -19.75440,
          lng: 63.35855,
        },
        {
          name: 'Duty Free Shop',
          category: 'services',
          description: 'Departure and arrival duty free operated by Rodrigues Duty Paradise Ltd. Perfumes, liquor, chocolates, electronics, and more.',
          lat: -19.75415,
          lng: 63.35820,
        },
        {
          name: 'Bookshop & Refreshments',
          category: 'services',
          description: 'Island Books & Clothing bookshop in the departure waiting area. Books, magazines, souvenirs, hot and cold drinks.',
          lat: -19.75425,
          lng: 63.35845,
        },
        {
          name: 'Food Counters',
          category: 'services',
          description: 'Food and beverage counters in the departure hall and public concourse. Hot meals, pastries, sandwiches, and drinks.',
          lat: -19.75410,
          lng: 63.35810,
        },
        {
          name: 'Help Desk',
          category: 'services',
          description: 'Airport information and passenger assistance desk. Contact: +230 832 78 88.',
          lat: -19.75400,
          lng: 63.35800,
        },
      ],
    },
  failedGlobalUpdates)

  await updateGlobalWithLogging(payload, 'contact-info', {
      helpDeskTitle: 'Contact and help desk',
      helpDeskSummary: 'Use the official contact details below for passenger support and airport enquiries.',
      cards: [
        { title: 'Help desk', value: '+230 832 78 88', link: 'tel:+2308327888' },
        { title: 'Email', value: 'info@arl.aero', link: 'mailto:info@arl.aero' },
      ],
    },
  failedGlobalUpdates)

  await upsertBySlug(payload, 'pages', 'about-us', {
    title: 'About Us',
    slug: 'about-us',
    summary: 'Institutional overview for Airport of Rodrigues Ltd.',
    status: 'published',
    sections: pageSections,
  })

  await upsertBySlug(payload, 'pages', 'airlines', {
    title: 'Airlines',
    slug: 'airlines',
    summary: 'Airline information page.',
    status: 'published',
    sections: pageSections,
  })

  await upsertBySlug(payload, 'pages', 'amenities', {
    title: 'Airport Amenities',
    slug: 'amenities',
    summary: 'Information about shops, dining, facilities, and other services available at Plaine Corail Airport.',
    status: 'published',
    sections: [
      {
        heading: 'Duty Free Shopping',
        body: richText(
          'Duty free shopping is available for all departing and arriving passengers at Plaine Corail Airport, operated by Rodrigues Duty Paradise Ltd (RDFP).\n\nThe shop offers a wide selection of top brand perfumes, cosmetics, liquor, chocolates, cigarettes, electronic equipment, wines, and more at competitive prices.\n\nThe arrival duty free shop was relocated to a larger premise in December 2018, offering a wider choice of products with an improved shopping experience. Opening hours follow the published flight schedule.',
        ),
        bullets: [
          { text: 'Available for departing and arriving passengers' },
          { text: 'Perfumes, cosmetics, liquor, chocolates, electronics, and more' },
          { text: 'Competitive duty free prices' },
          { text: 'Contact Rodrigues Duty Paradise Ltd for enquiries' },
        ],
      },
      {
        heading: 'Bookshop & Refreshments',
        body: richText(
          'The Island Books & Clothing bookshop is located in the departure waiting area, after immigration and cabin baggage security checkpoints. It is accessible to departing passengers only.\n\nThe bookshop offers a range of books, magazines, and novels in English and French for all ages, including books about Rodrigues Island and souvenir items.\n\nDeparting passengers may also purchase hot and cold drinks and snacks at the bookshop — this is the only refreshment point in the departure area. Opening hours follow the published flight schedule.',
        ),
        bullets: [
          { text: 'Located in the departure waiting area (after security)' },
          { text: 'Books, magazines, and souvenirs in English and French' },
          { text: 'Hot and cold drinks and snacks available' },
          { text: 'Only refreshment point in the departure area' },
        ],
      },
      {
        heading: 'Food Counters',
        body: richText(
          'Food counters are available in the departure hall and in the public concourse on the ground floor for passengers and airport visitors.\n\nThe food counters offer a wide range of cold and hot drinks, hot meals, pastries, sandwiches, and other refreshments. Opening hours follow the published flight schedule.',
        ),
        bullets: [
          { text: 'Available in the departure hall and public concourse' },
          { text: 'Hot meals, pastries, sandwiches, and drinks' },
          { text: 'Open to passengers and visitors' },
        ],
      },
      {
        heading: 'Passenger Assistance & Help Desk',
        body: richText(
          'The airport help desk is located in the terminal building and provides passenger assistance during operational hours.\n\nServices include general airport information, wheelchair and reduced mobility assistance (by advance arrangement), lost property enquiries, and coordination with airlines.\n\nContact the help desk at +230 832 78 88 or email info@arl.aero.',
        ),
        bullets: [
          { text: 'General airport information and directions' },
          { text: 'Wheelchair and reduced mobility assistance' },
          { text: 'Lost property enquiries' },
          { text: 'Phone: +230 832 78 88' },
        ],
      },
      {
        heading: 'Restrooms',
        body: richText(
          'Public restrooms are located in the departure hall, arrivals area, and public concourse.\n\nAccessible restrooms are available for passengers with reduced mobility.',
        ),
      },
      {
        heading: 'Wi-Fi',
        body: richText(
          'Limited Wi-Fi connectivity may be available in the terminal. Consult airport staff or check for available networks on your device.\n\nFor reliable internet access, consider purchasing a local SIM card from mobile operators available on Rodrigues.',
        ),
      },
      {
        heading: 'Currency & Banking',
        body: richText(
          'There is no bank branch or ATM permanently located within the airport terminal. Passengers are advised to arrange currency before arriving at the airport.\n\nBanks and ATMs are available in Port Mathurin, approximately 25 minutes from the airport.',
        ),
        bullets: [
          { text: 'No ATM at the airport — arrange currency in advance' },
          { text: 'Banks and ATMs available in Port Mathurin' },
          { text: 'Some duty free purchases may accept card payment' },
        ],
      },
    ],
  })

  await updateGlobalWithLogging(payload, 'vip-lounge', {
      pageTitle: 'Airport VIP Lounge',
      introduction:
        'Find official information about VIP lounge access, amenities, and contact details for Plaine Corail Airport.',
      amenities: [
        { item: 'Comfortable seating for eligible passengers' },
        { item: 'Refreshments aligned with operating hours' },
        { item: 'A quieter waiting area before departure' },
      ],
      eligibility:
        'Access is subject to airline arrangements, approved passenger categories, or operational authorisation from Airport of Rodrigues Ltd.',
      bookingInformation:
        'Passengers should confirm lounge availability and any access conditions with their airline or the airport help desk before travel.',
      operatingHours: 'Opening hours follow the published flight schedule.',
      contactPhone: '+230 832 78 88',
      contactEmail: 'info@arl.aero',
    },
  failedGlobalUpdates)
  await deleteBySlug(payload, 'pages', 'airport-vip-lounge')

  await upsertBySlug(payload, 'pages', 'airport-regulations', {
    title: 'Airport Regulations',
    slug: 'airport-regulations',
    summary: 'Approved passenger and airport regulations.',
    status: 'published',
    sections: pageSections,
  })

  await upsertBySlug(payload, 'pages', 'airport-usage-fees-information', {
    title: 'Airport Usage Fees Information',
    slug: 'airport-usage-fees-information',
    summary: 'Approved fee and charge information.',
    status: 'published',
    sections: pageSections,
  })

  try {
    await payload.create({
      collection: 'faqs',
      data: {
        question: 'How should I verify my flight information?',
        answer: 'Always verify your flight details using the official airport platform and your airline before travelling.',
        category: 'flights',
        order: 1,
        status: 'published',
      },
    })
  } catch (error) {
    failedGlobalUpdates.push('faqs')
    console.error('[seed] Failed to seed FAQ entry:', error)
  }

  if (failedGlobalUpdates.length > 0) {
    throw new Error(
      `[seed] Global updates failed: ${failedGlobalUpdates.join(', ')}`,
    )
  }

  console.log('Seed completed.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
