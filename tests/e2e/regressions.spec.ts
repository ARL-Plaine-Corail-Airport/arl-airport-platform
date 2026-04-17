import { expect, test, type Page } from '@playwright/test'

function normalizePhoneHref(href: string) {
  return href.replace(/^tel:/, '').replace(/[^\d+]/g, '')
}

async function emulateStandalonePwa(page: Page) {
  await page.addInitScript(() => {
    const originalMatchMedia = window.matchMedia.bind(window)

    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      get: () => true,
    })

    window.matchMedia = (query: string) => {
      if (query === '(display-mode: standalone)') {
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as MediaQueryList
      }

      return originalMatchMedia(query)
    }
  })
}

test.describe('Recent regressions', () => {
  test('legacy VIP lounge route resolves to the canonical VIP lounge page', async ({ page }) => {
    await page.goto('/airport-vip-lounge')

    await expect(page).toHaveURL(/\/(en|fr|mfe)\/vip-lounge$/)
    await expect(page).not.toHaveURL(/airport-vip-lounge/)
  })

  test('contact page does not render duplicate phone or email cards', async ({ page }) => {
    await page.goto('/contact')

    const telHrefs = await page.locator('.detail-card a[href^="tel:"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter((value): value is string => Boolean(value)),
    )
    const mailtoHrefs = await page.locator('.detail-card a[href^="mailto:"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter((value): value is string => Boolean(value)),
    )

    expect(telHrefs.length).toBeGreaterThan(0)
    expect(mailtoHrefs.length).toBeGreaterThan(0)
    expect(new Set(telHrefs.map(normalizePhoneHref)).size).toBe(telHrefs.length)
    expect(new Set(mailtoHrefs.map((href) => href.toLowerCase())).size).toBe(mailtoHrefs.length)
  })

  test('mobile contact page reserves space for the offline banner', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.site-wrapper')).toHaveCSS('display', 'flex')
    await context.setOffline(true)

    try {
      const banner = page.locator('.online-status-banner')
      await expect(banner).toHaveClass(/online-status-banner--visible/)
      await page.waitForFunction(() => {
        const bannerElement = document.querySelector<HTMLElement>('.online-status-banner')
        const wrapper = document.querySelector<HTMLElement>('.site-wrapper')

        if (!bannerElement || !wrapper) return false

        const bannerHeight = bannerElement.getBoundingClientRect().height
        const rootOffset = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--online-status-offset'),
        )
        const wrapperPaddingBottom = Number.parseFloat(getComputedStyle(wrapper).paddingBottom)

        return (
          bannerHeight > 0 &&
          rootOffset >= bannerHeight - 1 &&
          wrapperPaddingBottom >= bannerHeight - 1
        )
      })

      const metrics = await page.evaluate(() => {
        const bannerElement = document.querySelector<HTMLElement>('.online-status-banner')
        const wrapper = document.querySelector<HTMLElement>('.site-wrapper')

        if (!bannerElement || !wrapper) return null

        const rootOffset = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--online-status-offset'),
        )

        return {
          bannerHeight: bannerElement.getBoundingClientRect().height,
          bannerPosition: getComputedStyle(bannerElement).position,
          wrapperPaddingBottom: Number.parseFloat(getComputedStyle(wrapper).paddingBottom),
          rootOffset: Number.isFinite(rootOffset) ? rootOffset : 0,
        }
      })

      expect(metrics).not.toBeNull()
      expect(metrics?.bannerPosition).toBe('fixed')
      expect(metrics?.bannerHeight ?? 0).toBeGreaterThan(0)
      expect(metrics?.rootOffset ?? 0).toBeGreaterThanOrEqual((metrics?.bannerHeight ?? 0) - 1)
      expect(metrics?.wrapperPaddingBottom ?? 0).toBeGreaterThanOrEqual((metrics?.bannerHeight ?? 0) - 1)
    } finally {
      await context.setOffline(false)
    }
  })

  test('standalone splash is visible before hydration and hides site content', async ({ page }) => {
    await emulateStandalonePwa(page)
    await page.route(/_next\/static\/.*\.js(\?.*)?$/, (route) => route.abort())

    await page.goto('/contact', { waitUntil: 'domcontentloaded' })

    await page.waitForFunction(() => {
      const splash = document.querySelector<HTMLElement>('.splash-screen')
      const wrapper = document.querySelector<HTMLElement>('.site-wrapper')

      if (!splash || !wrapper) return false

      const splashStyle = getComputedStyle(splash)
      const wrapperStyle = getComputedStyle(wrapper)

      return (
        document.documentElement.dataset.pwaDisplay === 'standalone' &&
        document.documentElement.dataset.pwaSplash === 'active' &&
        splashStyle.display !== 'none' &&
        wrapperStyle.visibility === 'hidden' &&
        wrapperStyle.pointerEvents === 'none'
      )
    })

    const state = await page.evaluate(() => {
      const splash = document.querySelector<HTMLElement>('.splash-screen')
      const wrapper = document.querySelector<HTMLElement>('.site-wrapper')

      return {
        rootDisplay: document.documentElement.dataset.pwaDisplay ?? null,
        splashState: document.documentElement.dataset.pwaSplash ?? null,
        splashDisplay: splash ? getComputedStyle(splash).display : null,
        wrapperVisibility: wrapper ? getComputedStyle(wrapper).visibility : null,
        wrapperPointerEvents: wrapper ? getComputedStyle(wrapper).pointerEvents : null,
      }
    })

    expect(state.rootDisplay).toBe('standalone')
    expect(state.splashState).toBe('active')
    expect(state.splashDisplay).toBe('flex')
    expect(state.wrapperVisibility).toBe('hidden')
    expect(state.wrapperPointerEvents).toBe('none')
  })

  test('standalone splash dismisses cleanly without hydration warnings', async ({ page }) => {
    const consoleMessages: string[] = []
    const pageErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })
    page.on('pageerror', (error) => {
      pageErrors.push(String(error))
    })

    await emulateStandalonePwa(page)
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')

    await page.waitForFunction(() => {
      const wrapper = document.querySelector<HTMLElement>('.site-wrapper')

      return Boolean(
        wrapper &&
        !document.documentElement.dataset.pwaSplash &&
        getComputedStyle(wrapper).visibility === 'visible',
      )
    })

    const state = await page.evaluate(() => ({
      splashCount: document.querySelectorAll('.splash-screen').length,
      splashState: document.documentElement.dataset.pwaSplash ?? null,
      wrapperVisibility: getComputedStyle(document.querySelector<HTMLElement>('.site-wrapper')!).visibility,
      footerText: document.querySelector('.footer-bottom p')?.textContent ?? '',
    }))

    expect(state.splashCount).toBe(0)
    expect(state.splashState).toBeNull()
    expect(state.wrapperVisibility).toBe('visible')
    expect(state.footerText).toMatch(/\b20\d{2}\b/)

    const hydrationSignals = [...consoleMessages, ...pageErrors].filter((message) =>
      /hydration|did not match|server rendered html|text content does not match/i.test(message),
    )

    expect(hydrationSignals).toEqual([])
  })
})
