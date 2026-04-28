import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { JetBrains_Mono, Libre_Bodoni, Public_Sans } from 'next/font/google'

import '../globals.css'

import { AnalyticsTracker } from '@/components/analytics/tracker'
import { SiteFooter } from '@/components/layout/footer'
import { SiteHeader } from '@/components/layout/header'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { OnlineStatus } from '@/components/pwa/online-status'
import { PwaResumeRefresh } from '@/components/pwa/pwa-resume-refresh'
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

const pwaSplashBootstrap = `(() => {
  const logOnce = (message, error) => {
    if (window.__arlPwaSplashBootstrapLogged) return
    window.__arlPwaSplashBootstrapLogged = true
    console.warn(message, error)
  }

  try {
    const mediaStandalone = typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)').matches
      : (logOnce('[pwa] matchMedia is unavailable for splash bootstrap'), false)
    const navigatorStandalone =
      typeof window.navigator === 'object' &&
      'standalone' in window.navigator &&
      window.navigator.standalone === true
    const standalone =
      mediaStandalone ||
      navigatorStandalone

    if (!standalone) return

    const root = document.documentElement
    root.dataset.pwaDisplay = 'standalone'
    root.dataset.pwaSplash = 'active'

    if (!root.dataset.pwaSplashStartedAt) {
      root.dataset.pwaSplashStartedAt = String(Date.now())
    }
  } catch (error) {
    logOnce('[pwa] Splash bootstrap failed', error)
  }
})()`

const themeBootstrap = `(() => {
  const storageKey = 'arl-theme'
  const resolveSystemTheme = () => {
    if (typeof window.matchMedia !== 'function') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  try {
    const storedTheme = window.localStorage.getItem(storageKey)
    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : resolveSystemTheme()

    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  } catch (error) {
    const theme = resolveSystemTheme()
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    console.warn('[theme] Theme bootstrap used system fallback', error)
  }
})()`

const bodyFont = Public_Sans({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const displayFont = Libre_Bodoni({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const monoFont = JetBrains_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['500', '700'],
})

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
  viewportFit: 'cover',
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
  const currentYear = new Date().getFullYear()
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
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}
        suppressHydrationWarning
      >
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: pwaSplashBootstrap }}
        />
        <JsonLd data={orgSchema} nonce={nonce} />
        <I18nProvider locale={locale} dictionary={dictionary}>
          <PwaResumeRefresh />
          <ServiceWorkerRegister />
          <AnalyticsTracker />
          <SplashScreen />
          <PullToRefresh />
          <OnlineStatus />
          <InstallPrompt />
          <div className="site-wrapper">
            <SiteHeader phone={site.primaryPhone ?? undefined} />
            {children}
            <SiteFooter
              currentYear={currentYear}
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
