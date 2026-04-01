import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'

import '../globals.css'

import { AnalyticsTracker } from '@/components/analytics/tracker'
import { SiteFooter } from '@/components/layout/footer'
import { SiteHeader } from '@/components/layout/header'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { OnlineStatus } from '@/components/pwa/online-status'
import { PullToRefresh } from '@/components/pwa/pull-to-refresh'
import { SplashScreen } from '@/components/pwa/splash-screen'
import { ServiceWorkerRegister } from '@/components/pwa/sw-register'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { localePath } from '@/i18n/path'
import { I18nProvider } from '@/i18n/provider'
import { getSiteSettings } from '@/lib/content'
import { defaultSiteSettings } from '@/lib/defaults'
import { env } from '@/lib/env'
import { buildOrganizationSchema, JsonLd } from '@/lib/structured-data'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const site = await getSiteSettings(locale)

  const ogMedia =
    typeof site.defaultOgImage === 'object' ? site.defaultOgImage : null
  const ogImage = ogMedia?.url
    ? {
        url: ogMedia.url,
        alt: ogMedia.alt ?? undefined,
        width: ogMedia.width ?? undefined,
        height: ogMedia.height ?? undefined,
      }
    : undefined

  return {
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Rodrigues Airport',
    },
    ...(ogImage && {
      openGraph: { images: [ogImage] },
      twitter: { images: [ogImage.url] },
    }),
  }
}

export const viewport: Viewport = {
  themeColor: '#114c7a',
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const [site, dictionary] = await Promise.all([
    getSiteSettings(locale),
    getDictionary(locale),
  ])
  const localizedHomeUrl = new URL(localePath('/', locale), env.siteURL).toString()

  const orgSchema = buildOrganizationSchema({
    siteName: site.siteName ?? 'Airport of Rodrigues Ltd',
    airportName: site.airportName ?? 'Plaine Corail Airport',
    url: localizedHomeUrl,
    phone: site.primaryPhone ?? undefined,
    email: site.primaryEmail ?? undefined,
    address: site.physicalAddress ?? undefined,
    socialLinks: site.socialLinks ?? undefined,
  })

  return (
    <html lang={locale}>
      <body>
        <JsonLd data={orgSchema} nonce={nonce} />
        <I18nProvider locale={locale} dictionary={dictionary}>
          <ServiceWorkerRegister />
          <AnalyticsTracker />
          <SplashScreen />
          <PullToRefresh />
          <OnlineStatus />
          <InstallPrompt />
          <div className="site-wrapper">
            <SiteHeader />
            {children}
            <SiteFooter
              phone={site.primaryPhone ?? undefined}
              email={site.primaryEmail ?? undefined}
              address={site.physicalAddress ?? undefined}
              workingHours={site.workingHours ?? undefined}
              socialLinks={site.socialLinks?.length ? site.socialLinks : defaultSiteSettings.socialLinks}
            />
          </div>
        </I18nProvider>
      </body>
    </html>
  )
}
