import { afterEach, describe, expect, it, vi } from 'vitest'

const getPublishedPages = vi.fn()
const getAirportProjectItems = vi.fn()
const getNewsEvents = vi.fn()
const originalBuildFlag = process.env.ARL_SKIP_DB_DURING_BUILD

function mockPageModuleDeps() {
  vi.doMock('next/navigation', () => ({
    notFound: vi.fn(),
    redirect: vi.fn(),
  }))
  vi.doMock('next/headers', () => ({
    headers: vi.fn(async () => new Headers()),
  }))
  vi.doMock('@/components/ui/media-figure', () => ({
    MediaFigure: () => null,
  }))
  vi.doMock('@/components/ui/page-hero', () => ({
    PageHero: () => null,
  }))
  vi.doMock('@/components/ui/rich-text', () => ({
    RichText: () => null,
  }))
  vi.doMock('@/components/ui/section-list', () => ({
    SectionList: () => null,
  }))
  vi.doMock('@/i18n/get-dictionary', () => ({
    getDictionary: vi.fn(async () => ({})),
  }))
  vi.doMock('@/i18n/get-locale', () => ({
    getLocale: vi.fn(async () => 'en'),
  }))
  vi.doMock('@/i18n/path', () => ({
    localePath: vi.fn((path: string) => path),
  }))
  vi.doMock('@/lib/content', () => ({
    getPublishedPages,
    getPageBySlug: vi.fn(),
    getAirportProjectItems,
    getAirportProjectBySlug: vi.fn(),
    getNewsEvents,
    getNewsEventBySlug: vi.fn(),
  }))
  vi.doMock('@/lib/date', () => ({
    formatDateTime: vi.fn(() => ''),
  }))
  vi.doMock('@/lib/env', () => ({
    env: {
      siteURL: 'https://example.com',
    },
  }))
  vi.doMock('@/lib/metadata', () => ({
    buildFrontendMetadata: vi.fn(() => ({})),
  }))
  vi.doMock('@/lib/structured-data', () => ({
    JsonLd: () => null,
    buildBreadcrumbSchema: vi.fn(() => ({})),
    buildEventSchema: vi.fn(() => ({})),
    buildNewsArticleSchema: vi.fn(() => ({})),
  }))
}

describe('build-time static params guards', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()

    getPublishedPages.mockReset()
    getAirportProjectItems.mockReset()
    getNewsEvents.mockReset()

    if (originalBuildFlag === undefined) {
      delete process.env.ARL_SKIP_DB_DURING_BUILD
    } else {
      process.env.ARL_SKIP_DB_DURING_BUILD = originalBuildFlag
    }
  })

  it('returns no generic page params during build-time DB skip', async () => {
    process.env.ARL_SKIP_DB_DURING_BUILD = '1'
    getPublishedPages.mockResolvedValue([{ slug: 'contact' }])
    mockPageModuleDeps()

    const mod = await import('@/app/(frontend)/[slug]/page')

    await expect(mod.generateStaticParams()).resolves.toEqual([])
    expect(getPublishedPages).not.toHaveBeenCalled()
  })

  it('returns no airport project params during build-time DB skip', async () => {
    process.env.ARL_SKIP_DB_DURING_BUILD = '1'
    getAirportProjectItems.mockResolvedValue([{ slug: 'runway-upgrade' }])
    mockPageModuleDeps()

    const mod = await import('@/app/(frontend)/airport-project/[slug]/page')

    await expect(mod.generateStaticParams()).resolves.toEqual([])
    expect(getAirportProjectItems).not.toHaveBeenCalled()
  })

  it('returns no news event params during build-time DB skip', async () => {
    process.env.ARL_SKIP_DB_DURING_BUILD = '1'
    getNewsEvents.mockResolvedValue([{ slug: 'terminal-notice' }])
    mockPageModuleDeps()

    const mod = await import('@/app/(frontend)/news-events/[slug]/page')

    await expect(mod.generateStaticParams()).resolves.toEqual([])
    expect(getNewsEvents).not.toHaveBeenCalled()
  })
})
