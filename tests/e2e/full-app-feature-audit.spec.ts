import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { expect, test, type Page, type TestInfo } from '@playwright/test'

type FindingSeverity = 'failure' | 'manual_gap'

type Finding = {
  severity: FindingSeverity
  feature: string
  route: string
  file: string
  expected: string
  actual: string
  impact: string
  evidence: string
  fixPrompt: string
}

type CheckContext = Omit<Finding, 'severity' | 'actual' | 'evidence'>

const REPORT_PATH = path.join(process.cwd(), 'reports', 'full-app-feature-audit.md')
const LOCALES = ['en', 'fr', 'mfe'] as const

const PUBLIC_ROUTES = [
  { path: '/', feature: 'Home', file: 'src/app/(frontend)/page.tsx' },
  { path: '/arrivals', feature: 'Arrivals', file: 'src/app/(frontend)/arrivals/page.tsx' },
  { path: '/departures', feature: 'Departures', file: 'src/app/(frontend)/departures/page.tsx' },
  { path: '/flight-status', feature: 'Flight status', file: 'src/app/(frontend)/flight-status/page.tsx' },
  { path: '/notices', feature: 'Notices listing', file: 'src/app/(frontend)/notices/page.tsx' },
  { path: '/news-events', feature: 'News and events listing', file: 'src/app/(frontend)/news-events/page.tsx' },
  { path: '/airport-project', feature: 'Airport project listing', file: 'src/app/(frontend)/airport-project/page.tsx' },
  { path: '/passenger-guide', feature: 'Passenger guide', file: 'src/app/(frontend)/passenger-guide/page.tsx' },
  { path: '/transport-parking', feature: 'Transport and parking', file: 'src/app/(frontend)/transport-parking/page.tsx' },
  { path: '/airport-map', feature: 'Airport map', file: 'src/app/(frontend)/airport-map/page.tsx' },
  { path: '/duty-free', feature: 'Duty free', file: 'src/app/(frontend)/duty-free/page.tsx' },
  { path: '/amenities', feature: 'Amenities', file: 'src/app/(frontend)/amenities/page.tsx' },
  { path: '/vip-lounge', feature: 'VIP lounge', file: 'src/app/(frontend)/vip-lounge/page.tsx' },
  { path: '/accessibility', feature: 'Accessibility', file: 'src/app/(frontend)/accessibility/page.tsx' },
  { path: '/faq', feature: 'FAQ', file: 'src/app/(frontend)/faq/page.tsx' },
  { path: '/contact', feature: 'Contact', file: 'src/app/(frontend)/contact/page.tsx' },
  { path: '/emergency-services', feature: 'Emergency services', file: 'src/app/(frontend)/emergency-services/page.tsx' },
  { path: '/useful-links', feature: 'Useful links', file: 'src/app/(frontend)/useful-links/page.tsx' },
  { path: '/career', feature: 'Career', file: 'src/app/(frontend)/career/page.tsx' },
  { path: '/privacy', feature: 'Privacy', file: 'src/app/(frontend)/privacy/page.tsx' },
  { path: '/terms-conditions', feature: 'Terms and conditions', file: 'src/app/(frontend)/terms-conditions/page.tsx' },
  { path: '/disclaimer', feature: 'Disclaimer', file: 'src/app/(frontend)/disclaimer/page.tsx' },
  { path: '/offline', feature: 'Offline page', file: 'src/app/(frontend)/offline/page.tsx' },
] as const

const DETAIL_LISTINGS = [
  {
    path: '/notices',
    prefix: '/notices/',
    feature: 'Notice detail pages',
    file: 'src/app/(frontend)/notices/[slug]/page.tsx',
  },
  {
    path: '/news-events',
    prefix: '/news-events/',
    feature: 'News/event detail pages',
    file: 'src/app/(frontend)/news-events/[slug]/page.tsx',
  },
  {
    path: '/airport-project',
    prefix: '/airport-project/',
    feature: 'Airport project detail pages',
    file: 'src/app/(frontend)/airport-project/[slug]/page.tsx',
  },
] as const

const DASHBOARD_ROUTES = [
  { path: '/dashboard', file: 'src/app/(dashboard)/dashboard/page.tsx' },
  { path: '/dashboard/analytics', file: 'src/app/(dashboard)/dashboard/analytics/page.tsx' },
  { path: '/dashboard/flights', file: 'src/app/(dashboard)/dashboard/flights/page.tsx' },
  { path: '/dashboard/notices', file: 'src/app/(dashboard)/dashboard/notices/page.tsx' },
  { path: '/dashboard/emergency', file: 'src/app/(dashboard)/dashboard/emergency/page.tsx' },
  { path: '/dashboard/weather', file: 'src/app/(dashboard)/dashboard/weather/page.tsx' },
  { path: '/dashboard/pages-cms', file: 'src/app/(dashboard)/dashboard/pages-cms/page.tsx' },
  { path: '/dashboard/faqs', file: 'src/app/(dashboard)/dashboard/faqs/page.tsx' },
  { path: '/dashboard/airlines', file: 'src/app/(dashboard)/dashboard/airlines/page.tsx' },
  { path: '/dashboard/amenities', file: 'src/app/(dashboard)/dashboard/amenities/page.tsx' },
  { path: '/dashboard/transport', file: 'src/app/(dashboard)/dashboard/transport/page.tsx' },
  { path: '/dashboard/media', file: 'src/app/(dashboard)/dashboard/media/page.tsx' },
  { path: '/dashboard/users', file: 'src/app/(dashboard)/dashboard/users/page.tsx' },
  { path: '/dashboard/audit', file: 'src/app/(dashboard)/dashboard/audit/page.tsx' },
  { path: '/dashboard/settings', file: 'src/app/(dashboard)/dashboard/settings/page.tsx' },
] as const

function localizedPath(routePath: string, locale: string): string {
  return routePath === '/' ? `/${locale}` : `/${locale}${routePath}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function markdownValue(value: string): string {
  return value.replace(/\r?\n/g, ' ').trim()
}

function fixPrompt(context: CheckContext): string {
  return [
    `Investigate ${context.route} for the ${context.feature} feature.`,
    `Likely file: ${context.file}.`,
    `Expected: ${context.expected}.`,
    'Make the smallest safe fix, preserve public API response shapes and authorization behavior, then rerun `pnpm test:e2e:full` plus the focused affected tests.',
  ].join(' ')
}

async function writeAuditReport(findings: Finding[]) {
  const failures = findings.filter((finding) => finding.severity === 'failure')
  const gaps = findings.filter((finding) => finding.severity === 'manual_gap')
  const lines = [
    '# Full-App Feature Audit Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Failures: ${failures.length}`,
    `Manual gaps: ${gaps.length}`,
    '',
  ]

  if (failures.length === 0) {
    lines.push('## Failures', '', 'No automated failures were found.', '')
  } else {
    lines.push('## Failures', '')
    failures.forEach((finding, index) => appendFinding(lines, finding, index + 1))
  }

  if (gaps.length > 0) {
    lines.push('## Manual Gaps', '')
    gaps.forEach((finding, index) => appendFinding(lines, finding, index + 1))
  }

  await mkdir(path.dirname(REPORT_PATH), { recursive: true })
  await writeFile(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8')
}

function appendFinding(lines: string[], finding: Finding, index: number) {
  lines.push(
    `### ${index}. ${finding.feature}`,
    '',
    `- Severity: ${finding.severity}`,
    `- Route/API: \`${finding.route}\``,
    `- Likely file: \`${finding.file}\``,
    `- Expected: ${markdownValue(finding.expected)}`,
    `- Actual: ${markdownValue(finding.actual)}`,
    `- Impact: ${markdownValue(finding.impact)}`,
    `- Evidence: ${markdownValue(finding.evidence)}`,
    '- Fix prompt:',
    '',
    '```text',
    finding.fixPrompt,
    '```',
    '',
  )
}

async function runCheck(
  findings: Finding[],
  context: CheckContext,
  task: () => Promise<void>,
) {
  try {
    await task()
  } catch (error) {
    findings.push({
      ...context,
      severity: 'failure',
      actual: errorMessage(error),
      evidence: error instanceof Error && error.stack ? error.stack : errorMessage(error),
      fixPrompt: context.fixPrompt || fixPrompt(context),
    })
  }
}

function recordManualGap(findings: Finding[], context: CheckContext, actual: string, evidence: string) {
  findings.push({
    ...context,
    severity: 'manual_gap',
    actual,
    evidence,
    fixPrompt: context.fixPrompt || fixPrompt(context),
  })
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function sameOrigin(url: string, baseURL: string): boolean {
  return new URL(url, baseURL).origin === new URL(baseURL).origin
}

async function assertPublicPage(page: Page, routePath: string, baseURL: string) {
  const response = await page.goto(routePath, { waitUntil: 'domcontentloaded', timeout: 20_000 })
  assertCondition(response, 'Navigation did not return a response.')
  assertCondition(response.ok(), `Expected a 2xx response, received ${response.status()}.`)
  await page.locator('body').waitFor({ state: 'visible', timeout: 5_000 })

  const bodyText = await page.locator('body').innerText({ timeout: 5_000 })
  assertCondition(bodyText.trim().length > 0, 'Rendered body is empty.')
  assertCondition(!/application error|internal server error/i.test(bodyText), 'Rendered page contains an error fallback.')

  const headerVisible = await page.locator('.site-header').first().isVisible({ timeout: 5_000 }).catch(() => false)
  assertCondition(headerVisible, 'Site header is not visible on the public route.')
  assertCondition(sameOrigin(page.url(), baseURL), `Navigation escaped the configured app origin: ${page.url()}`)
}

async function auditBrowserRoute(
  findings: Finding[],
  page: Page,
  baseURL: string,
  routePath: string,
  context: CheckContext,
) {
  const consoleErrors: string[] = []
  const requestFailures: string[] = []
  const serverFailures: string[] = []

  await page.addInitScript(() => {
    const originalSendBeacon = navigator.sendBeacon?.bind(navigator)

    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: (url: string | URL, data?: BodyInit | null) => {
        if (String(url).includes('/api/track')) return true
        return originalSendBeacon ? originalSendBeacon(url, data) : false
      },
    })
  })

  page.on('console', (message) => {
    const text = message.text()
    if (message.type() === 'error' && !/Failed to load resource/i.test(text)) {
      consoleErrors.push(text)
    }
  })
  page.on('pageerror', (error) => {
    consoleErrors.push(errorMessage(error))
  })
  page.on('requestfailed', (request) => {
    if (sameOrigin(request.url(), baseURL)) {
      requestFailures.push(`${request.failure()?.errorText ?? 'failed'} ${request.url()}`)
    }
  })
  page.on('response', (response) => {
    if (sameOrigin(response.url(), baseURL) && response.status() >= 500) {
      serverFailures.push(`${response.status()} ${response.url()}`)
    }
  })

  await runCheck(findings, context, async () => {
    await assertPublicPage(page, routePath, baseURL)
    await page.waitForTimeout(250)
    assertCondition(consoleErrors.length === 0, `Browser console/page errors: ${consoleErrors.join(' | ')}`)
    assertCondition(requestFailures.length === 0, `Same-origin request failures: ${requestFailures.join(' | ')}`)
    assertCondition(serverFailures.length === 0, `Same-origin 5xx responses: ${serverFailures.join(' | ')}`)
  })
}

function extractDetailLinks(html: string, locale: string, prefix: string): string[] {
  const matches = html.matchAll(new RegExp(`href=["'](${localizedPath(prefix, locale)}[^"'?#]+)`, 'g'))
  return Array.from(new Set(Array.from(matches, (match) => match[1]))).slice(0, 3)
}

test.describe.configure({ mode: 'serial' })

test('full app feature audit', async ({ browser, request }, testInfo: TestInfo) => {
  test.skip(
    process.env.npm_lifecycle_event !== 'test:e2e:full' && process.env.FULL_APP_AUDIT !== '1',
    'Run this broad audit with `pnpm test:e2e:full`.',
  )
  test.setTimeout(360_000)

  const findings: Finding[] = []
  const baseURL = String(testInfo.project.use.baseURL ?? 'http://localhost:3000')
  let apiProbeIndex = 10
  const apiHeaders = (extra: Record<string, string> = {}) => ({
    'x-forwarded-for': `198.51.100.${apiProbeIndex++}`,
    ...extra,
  })

  for (const locale of LOCALES) {
    for (const route of PUBLIC_ROUTES) {
      const page = await browser.newPage()
      const routePath = localizedPath(route.path, locale)

      await auditBrowserRoute(findings, page, baseURL, routePath, {
        feature: `${route.feature} (${locale})`,
        route: routePath,
        file: route.file,
        expected: 'The localized public page returns 2xx HTML, renders the public shell, and has no same-origin 5xx/network/browser errors.',
        impact: 'Passengers may be unable to use this public feature or may see a broken page.',
        fixPrompt: '',
      })

      await page.close()
    }
  }

  for (const locale of LOCALES) {
    for (const listing of DETAIL_LISTINGS) {
      const listingPath = localizedPath(listing.path, locale)
      const listingResponse = await request.get(listingPath, { failOnStatusCode: false })
      const html = await listingResponse.text()
      const detailLinks = extractDetailLinks(html, locale, listing.prefix)

      if (detailLinks.length === 0) {
        recordManualGap(
          findings,
          {
            feature: `${listing.feature} (${locale})`,
            route: listingPath,
            file: listing.file,
            expected: 'Seeded published content provides at least one detail link for browser verification.',
            impact: 'The audit cannot automatically prove detail-page behavior without published content.',
            fixPrompt: 'Seed or publish representative content, then rerun `pnpm test:e2e:full` to verify detail pages.',
          },
          'No detail links were present in the rendered listing.',
          `Checked listing HTML for links starting with ${localizedPath(listing.prefix, locale)}.`,
        )
        continue
      }

      for (const detailLink of detailLinks) {
        const page = await browser.newPage()
        await auditBrowserRoute(findings, page, baseURL, detailLink, {
          feature: `${listing.feature} (${locale})`,
          route: detailLink,
          file: listing.file,
          expected: 'Seeded detail pages return 2xx HTML and render without same-origin 5xx/network/browser errors.',
          impact: 'Users may not be able to open published detail content from the listing.',
          fixPrompt: '',
        })
        await page.close()
      }
    }
  }

  await runCheck(findings, {
    feature: 'Health API',
    route: '/api/health',
    file: 'src/app/api/health/route.ts',
    expected: 'Shallow health returns 200 with ok=true and no-store cache headers.',
    impact: 'Infrastructure health checks may restart or route around a healthy app incorrectly.',
    fixPrompt: '',
  }, async () => {
    const response = await request.get('/api/health', { headers: apiHeaders() })
    const body = await response.json()
    assertCondition(response.status() === 200, `Expected 200, received ${response.status()}.`)
    assertCondition(body.ok === true, `Expected ok=true, received ${JSON.stringify(body)}.`)
    assertCondition(response.headers()['cache-control'] === 'no-store', 'Expected Cache-Control: no-store.')
  })

  await runCheck(findings, {
    feature: 'Status API auth',
    route: '/api/status',
    file: 'src/app/api/status/route.ts',
    expected: 'Status endpoint rejects unauthenticated requests with 401 and no-store.',
    impact: 'Operational status data could be exposed or monitoring could receive the wrong auth signal.',
    fixPrompt: '',
  }, async () => {
    const response = await request.get('/api/status', {
      failOnStatusCode: false,
      headers: apiHeaders(),
    })
    assertCondition(response.status() === 401, `Expected 401, received ${response.status()}.`)
    assertCondition(response.headers()['cache-control'] === 'no-store', 'Expected Cache-Control: no-store.')
  })

  await runCheck(findings, {
    feature: 'Flight board API',
    route: '/api/flight-board',
    file: 'src/app/api/flight-board/route.ts',
    expected: 'Arrivals and departures return stable 200 JSON board responses.',
    impact: 'Passengers may not see flight information or fallback messaging.',
    fixPrompt: '',
  }, async () => {
    for (const boardType of ['arrivals', 'departures']) {
      const response = await request.get(`/api/flight-board?type=${boardType}`, {
        failOnStatusCode: false,
        headers: apiHeaders(),
      })
      const body = await response.json()
      assertCondition(response.status() === 200, `Expected 200 for ${boardType}, received ${response.status()}.`)
      assertCondition(body.boardType === boardType, `Expected boardType ${boardType}, received ${JSON.stringify(body)}.`)
      assertCondition(Array.isArray(body.records), `Expected records array, received ${JSON.stringify(body)}.`)
    }
  })

  await runCheck(findings, {
    feature: 'Weather API',
    route: '/api/weather',
    file: 'src/app/api/weather/route.ts',
    expected: 'Weather returns 200 JSON with provider metadata or degraded fallback data.',
    impact: 'Weather preview and dashboard weather checks may be unavailable.',
    fixPrompt: '',
  }, async () => {
    const response = await request.get('/api/weather', {
      failOnStatusCode: false,
      headers: apiHeaders(),
    })
    const body = await response.json()
    assertCondition(response.status() === 200, `Expected 200, received ${response.status()} with ${JSON.stringify(body)}.`)
    assertCondition(typeof body.providerLabel === 'string', `Expected providerLabel, received ${JSON.stringify(body)}.`)
  })

  await runCheck(findings, {
    feature: 'Analytics API origin and blocked paths',
    route: '/api/track',
    file: 'src/app/api/track/route.ts',
    expected: 'Cross-origin analytics requests return 403 and same-origin admin/dashboard/API paths are ignored with 204.',
    impact: 'Analytics could either reject valid app traffic or store admin/API page views.',
    fixPrompt: '',
  }, async () => {
    const crossOrigin = await request.post('/api/track', {
      failOnStatusCode: false,
      data: { type: 'pageview', path: '/en/contact' },
      headers: apiHeaders({ origin: 'https://example.invalid' }),
    })
    assertCondition(crossOrigin.status() === 403, `Expected 403 for cross-origin request, received ${crossOrigin.status()}.`)

    for (const blockedPath of ['/admin/login', '/dashboard', '/api/health']) {
      const response = await request.post('/api/track', {
        failOnStatusCode: false,
        data: { type: 'pageview', path: blockedPath },
        headers: apiHeaders({ 'sec-fetch-site': 'same-origin' }),
      })
      assertCondition(response.status() === 204, `Expected 204 for ${blockedPath}, received ${response.status()}.`)
    }
  })

  await runCheck(findings, {
    feature: 'Revalidate API auth',
    route: '/api/revalidate',
    file: 'src/app/api/revalidate/route.ts',
    expected: 'Revalidation rejects requests without the secret header with 401 and no-store.',
    impact: 'Unauthorized callers could purge caches or valid CMS hooks could receive the wrong auth signal.',
    fixPrompt: '',
  }, async () => {
    const response = await request.post('/api/revalidate', {
      failOnStatusCode: false,
      data: { paths: ['/contact'] },
      headers: apiHeaders(),
    })
    assertCondition(response.status() === 401, `Expected 401, received ${response.status()}.`)
    assertCondition(response.headers()['cache-control'] === 'no-store', 'Expected Cache-Control: no-store.')
  })

  await runCheck(findings, {
    feature: 'Locale-prefixed reserved routing',
    route: '/en/api/health, /fr/dashboard, /mfe/admin/login',
    file: 'src/middleware.ts',
    expected: 'Locale-prefixed API, dashboard, and admin paths keep reserved handling and do not receive public locale cache headers.',
    impact: 'Reserved routes could be cached or tracked as public localized content.',
    fixPrompt: '',
  }, async () => {
    const apiResponse = await request.get('/en/api/health', { headers: apiHeaders() })
    assertCondition(apiResponse.status() === 200, `Expected /en/api/health 200, received ${apiResponse.status()}.`)
    assertCondition(apiResponse.headers()['x-locale'] === undefined, 'Expected no x-locale response header on reserved API route.')

    const dashboardResponse = await request.get('/fr/dashboard', { failOnStatusCode: false, maxRedirects: 0 })
    assertCondition([307, 308].includes(dashboardResponse.status()), `Expected dashboard redirect, received ${dashboardResponse.status()}.`)
    assertCondition(dashboardResponse.headers()['cache-control']?.includes('private, no-store') === true, 'Expected private no-store dashboard response.')
    assertCondition(dashboardResponse.headers().location?.includes('/dashboard') === true, 'Expected localized dashboard redirect to canonical /dashboard.')
    const canonicalDashboardResponse = await request.get(String(dashboardResponse.headers().location), {
      failOnStatusCode: false,
      maxRedirects: 0,
    })
    assertCondition([307, 308].includes(canonicalDashboardResponse.status()), `Expected canonical dashboard redirect, received ${canonicalDashboardResponse.status()}.`)
    assertCondition(canonicalDashboardResponse.headers().location?.includes('/admin/login') === true, 'Expected canonical dashboard redirect to admin login.')
    assertCondition(dashboardResponse.headers()['cache-control']?.includes('private, no-store') === true, 'Expected private no-store dashboard response.')

    const adminResponse = await request.get('/mfe/admin/login', { failOnStatusCode: false, maxRedirects: 0 })
    assertCondition([307, 308].includes(adminResponse.status()), `Expected localized admin redirect, received ${adminResponse.status()}.`)
    assertCondition(adminResponse.headers().location?.includes('/admin/login') === true, 'Expected localized admin redirect to canonical /admin/login.')
    assertCondition(adminResponse.headers()['cache-control']?.includes('private, no-store') === true, 'Expected private no-store admin response.')
    const canonicalAdminResponse = await request.get(String(adminResponse.headers().location), { failOnStatusCode: false })
    assertCondition(canonicalAdminResponse.status() === 200, `Expected canonical /admin/login 200, received ${canonicalAdminResponse.status()}.`)
    assertCondition(canonicalAdminResponse.headers()['content-security-policy']?.includes("'unsafe-inline'") === true, 'Expected admin CSP on canonical admin route.')
  })

  await runCheck(findings, {
    feature: 'PWA manifest and service worker',
    route: '/manifest.webmanifest, /sw.js',
    file: 'src/app/manifest.ts and public/sw.js',
    expected: 'Manifest and service worker expose install/offline metadata, safe cache policy, localized fallbacks, and reserved route exclusions.',
    impact: 'Installed PWA users may see stale, blank, or incorrectly cached admin/API content.',
    fixPrompt: '',
  }, async () => {
    const manifestResponse = await request.get('/manifest.webmanifest')
    const manifest = await manifestResponse.json()
    assertCondition(manifestResponse.status() === 200, `Expected manifest 200, received ${manifestResponse.status()}.`)
    assertCondition(manifest.background_color === '#114c7a', `Unexpected manifest background ${manifest.background_color}.`)
    assertCondition(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'Manifest has no icons.')

    const swResponse = await request.get('/sw.js')
    const worker = await swResponse.text()
    assertCondition(swResponse.status() === 200, `Expected service worker 200, received ${swResponse.status()}.`)
    assertCondition(swResponse.headers()['service-worker-allowed'] === '/', 'Expected Service-Worker-Allowed: /.')
    assertCondition(swResponse.headers()['cache-control']?.includes('must-revalidate') === true, 'Expected service worker must-revalidate cache policy.')
    for (const snippet of [
      'getOfflineFallbackUrl',
      "const EXCLUDED_PREFIXES = ['/admin', '/dashboard']",
      "const LIVE_API_ROUTES = ['/api/flight-board', '/api/weather']",
      'safeCachePut',
    ]) {
      assertCondition(worker.includes(snippet), `Service worker is missing expected snippet: ${snippet}.`)
    }
  })

  await runCheck(findings, {
    feature: 'Offline banner',
    route: '/en/contact',
    file: 'src/components/pwa/online-status.tsx',
    expected: 'The public shell shows the offline banner and reserves layout space when the browser goes offline.',
    impact: 'PWA users may not understand that content is stale or offline-only.',
    fixPrompt: '',
  }, async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/en/contact', { waitUntil: 'domcontentloaded' })
      await context.setOffline(true)
      await page.locator('.online-status-banner').waitFor({ state: 'attached', timeout: 5_000 })
      const isVisible = await page.locator('.online-status-banner').evaluate((element) =>
        element.classList.contains('online-status-banner--visible'),
      )
      assertCondition(isVisible, 'Offline banner did not become visible after context.setOffline(true).')
    } finally {
      await context.setOffline(false).catch(() => undefined)
      await context.close()
    }
  })

  await runCheck(findings, {
    feature: 'Admin login and unauthenticated dashboard guard',
    route: '/admin/login, /dashboard',
    file: 'src/middleware.ts and src/app/(payload)/admin/[[...segments]]/page.tsx',
    expected: 'Admin login renders under admin CSP, while unauthenticated dashboard requests redirect to admin login.',
    impact: 'Admins may be unable to log in, or protected dashboard pages may be exposed.',
    fixPrompt: '',
  }, async () => {
    const dashboardResponse = await request.get('/dashboard', { failOnStatusCode: false, maxRedirects: 0 })
    assertCondition([307, 308].includes(dashboardResponse.status()), `Expected dashboard redirect, received ${dashboardResponse.status()}.`)
    assertCondition(dashboardResponse.headers().location?.includes('/admin/login') === true, 'Expected redirect to /admin/login.')

    const adminResponse = await request.get('/admin/login')
    assertCondition(adminResponse.status() === 200, `Expected admin login 200, received ${adminResponse.status()}.`)
    assertCondition(adminResponse.headers()['content-security-policy']?.includes("'unsafe-inline'") === true, 'Expected looser admin CSP.')

    const page = await browser.newPage()
    try {
      await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
      const hasEmailInput = await page.locator('input[name="email"], input[type="email"]').first().isVisible({ timeout: 10_000 }).catch(() => false)
      const bodyText = await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '')
      assertCondition(
        hasEmailInput || /login|email|password/i.test(bodyText),
        'Admin login did not expose a visible email input or recognizable login text.',
      )
    } finally {
      await page.close()
    }
  })

  const adminEmail = process.env.E2E_ADMIN_EMAIL
  const adminPassword = process.env.E2E_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    recordManualGap(
      findings,
      {
        feature: 'Authenticated admin and dashboard coverage',
        route: '/admin and /dashboard/*',
        file: 'src/app/(payload)/admin/[[...segments]]/page.tsx and src/app/(dashboard)/dashboard/*',
        expected: 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD identify a super_admin account so every dashboard module can be verified.',
        impact: 'The audit cannot prove authenticated admin workflows or role-gated dashboard modules in this environment.',
        fixPrompt: 'Set `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` for a disposable super_admin account, then rerun `pnpm test:e2e:full`.',
      },
      'Authenticated checks skipped because E2E admin credentials are not configured.',
      'Environment variables E2E_ADMIN_EMAIL and/or E2E_ADMIN_PASSWORD are missing.',
    )
  } else {
    await runCheck(findings, {
      feature: 'Authenticated admin and dashboard coverage',
      route: '/admin and /dashboard/*',
      file: 'src/app/(payload)/admin/[[...segments]]/page.tsx and src/app/(dashboard)/dashboard/*',
      expected: 'A configured super_admin can sign in and open every dashboard module without redirects or runtime errors.',
      impact: 'Admins may be blocked from operating CMS/dashboard features after deployment.',
      fixPrompt: '',
    }, async () => {
      const context = await browser.newContext()
      const page = await context.newPage()
      try {
        await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
        await page.locator('input[name="email"], input[type="email"]').first().fill(adminEmail)
        await page.locator('input[name="password"], input[type="password"]').first().fill(adminPassword)
        await page.locator('button[type="submit"]').first().click()
        await page.waitForURL(/\/admin(\/.*)?$/, { timeout: 20_000 })

        for (const dashboardRoute of DASHBOARD_ROUTES) {
          const response = await page.goto(dashboardRoute.path, { waitUntil: 'domcontentloaded', timeout: 20_000 })
          assertCondition(response?.ok(), `Expected ${dashboardRoute.path} 2xx, received ${response?.status() ?? 'no response'}.`)
          assertCondition(!page.url().includes('/admin/login'), `${dashboardRoute.path} redirected to admin login after authenticated login.`)
          const bodyText = await page.locator('body').innerText({ timeout: 5_000 })
          assertCondition(!/application error|internal server error/i.test(bodyText), `${dashboardRoute.path} rendered an error fallback.`)
        }
      } finally {
        await context.close()
      }
    })
  }

  await writeAuditReport(findings)

  const failures = findings.filter((finding) => finding.severity === 'failure')
  expect(failures, `Full-app audit found ${failures.length} failure(s). See ${REPORT_PATH}`).toEqual([])
})
