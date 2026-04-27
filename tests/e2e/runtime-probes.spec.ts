import { expect, test } from '@playwright/test'

test.describe('Runtime probes', () => {
  test('unprefixed public routes redirect to the default locale', async ({ request }) => {
    const response = await request.get('/contact', {
      failOnStatusCode: false,
      maxRedirects: 0,
    })

    expect(response.status()).toBe(307)
    expect(response.headers().location).toBe('/en/contact')
  })

  test('localized public routes return locale headers and public CSP', async ({ request }) => {
    for (const locale of ['en', 'fr']) {
      const response = await request.get(`/${locale}/contact`)
      const csp = response.headers()['content-security-policy']
      const nonce = csp?.match(/'nonce-([^']+)'/)?.[1]
      const html = await response.text()

      expect(response.ok()).toBeTruthy()
      expect(response.headers()['x-locale']).toBe(locale)
      expect(response.headers()['x-nonce']).toBeUndefined()
      expect(csp).toContain("script-src 'self' 'nonce-")
      expect(nonce).toBeTruthy()
      expect(html).toContain(`nonce="${nonce}"`)
      expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
      expect(response.headers()['x-content-type-options']).toBe('nosniff')
      expect(response.headers()['permissions-policy']).toContain('camera=()')
      expect(response.headers()['strict-transport-security']).toContain('max-age=')
    }
  })

  test('admin login uses the looser admin CSP', async ({ request }) => {
    const response = await request.get('/admin/login')

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'")
    expect(response.headers()['x-nonce']).toBeUndefined()
  })

  test('admin login with a dashboard redirect target stays renderable', async ({ page }) => {
    const adminRenderErrors: string[] = []
    page.on('console', (message) => {
      const text = message.text()
      if (
        message.type() === 'error' &&
        (
          text.includes('[payload-admin] render error') ||
          text.includes('Failed to fetch RSC payload') ||
          text.includes('network error')
        )
      ) {
        adminRenderErrors.push(text)
      }
    })

    await page.goto('/admin/login?redirect=%2Fdashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await expect(page.getByText('Admin view failed to render')).toHaveCount(0)
    expect(adminRenderErrors).toEqual([])
  })

  test('shared chrome does not trigger automatic RSC prefetches on initial render', async ({ page }) => {
    const rscRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (
        request.resourceType() === 'fetch' &&
        url.startsWith('http://localhost:3000/') &&
        url.includes('_rsc=')
      ) {
        rscRequests.push(url)
      }
    })

    await page.goto('/en/notices', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    expect(rscRequests).toEqual([])
  })

  test('unauthenticated dashboard requests redirect to admin login', async ({ request }) => {
    const response = await request.get('/dashboard', {
      failOnStatusCode: false,
      maxRedirects: 0,
    })

    expect([307, 308]).toContain(response.status())
    expect(response.headers().location).toContain('/admin/login?redirect=%2Fdashboard')
    expect(response.headers()['content-security-policy']).toContain("script-src 'self' 'nonce-")
  })

  test('locale-prefixed reserved routes keep reserved handling instead of public locale caching', async ({ request }) => {
    const apiResponse = await request.get('/en/api/health')

    expect(apiResponse.ok()).toBeTruthy()
    expect(apiResponse.headers()['x-locale']).toBeUndefined()
    expect(apiResponse.headers()['cache-control'] ?? '').not.toContain('public, s-maxage=60')
    expect(apiResponse.headers()['x-ratelimit-limit']).toBeTruthy()

    const dashboardResponse = await request.get('/fr/dashboard', {
      failOnStatusCode: false,
      maxRedirects: 0,
    })

    expect([307, 308]).toContain(dashboardResponse.status())
    expect(dashboardResponse.headers().location).toContain('/admin/login?redirect=%2Fdashboard')
    expect(dashboardResponse.headers()['x-locale']).toBeUndefined()
    expect(dashboardResponse.headers()['cache-control']).toContain('private, no-store')
  })

  test('manifest colors align with the splash background', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest')
    const manifest = JSON.parse(await response.text())

    expect(manifest.background_color).toBe('#114c7a')
    expect(manifest.theme_color).toBe('#114c7a')
  })

  test('service worker is served with the expected cache policy and localized offline logic', async ({ request }) => {
    const response = await request.get('/sw.js')
    const worker = await response.text()

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['service-worker-allowed']).toBe('/')
    expect(response.headers()['cache-control']).toContain('must-revalidate')
    expect(worker).toContain("const CACHE_PREFIX = 'arl-static-'")
    expect(worker).toContain("new URL(self.location.href).searchParams.get('v') || 'dev'")
    expect(worker).toContain('const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`')
    expect(worker).toContain("const OFFLINE_PATH = '/offline'")
    expect(worker).toContain("function getOfflineFallbackUrl(pathname)")
    expect(worker).toContain("const locale = getLocaleFromPath(pathname) ?? DEFAULT_LOCALE")
    expect(worker).toContain('return localePath(OFFLINE_PATH, locale)')
    expect(worker).toContain("const EXCLUDED_PREFIXES = ['/admin', '/dashboard']")
    expect(worker).toContain("const LIVE_API_ROUTES = ['/api/flight-board', '/api/weather']")
  })

  test('sitemap excludes the legacy airport VIP lounge slug and keeps the canonical VIP lounge route', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    const sitemap = await response.text()

    expect(response.ok()).toBeTruthy()
    expect(sitemap).toContain('/en/vip-lounge')
    expect(sitemap).not.toContain('airport-vip-lounge')
  })

  test('analytics route rejects admin, dashboard, and api paths', async ({ request }) => {
    for (const path of ['/admin/login', '/dashboard', '/api/health']) {
      const response = await request.post('/api/track', {
        failOnStatusCode: false,
        data: { path, referrer: null },
        headers: {
          'sec-fetch-site': 'same-origin',
        },
      })

      expect(response.status(), `expected ${path} to be ignored`).toBe(204)
      await expect(response.text()).resolves.toBe('')
    }
  })
})
