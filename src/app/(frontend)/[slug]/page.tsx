import { notFound } from 'next/navigation'

import { MediaFigure } from '@/components/ui/media-figure'
import { PageHero } from '@/components/ui/page-hero'
import { SectionList } from '@/components/ui/section-list'
import { getDictionary } from '@/i18n/get-dictionary'
import { getLocale } from '@/i18n/get-locale'
import { getPageBySlug, getPublishedPages } from '@/lib/content'
import { buildFrontendMetadata } from '@/lib/metadata'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const pages = await getPublishedPages()
  return pages.map((page: any) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const [dict, page] = await Promise.all([
    getDictionary(locale),
    getPageBySlug(slug, locale),
  ])

  if (!page) {
    return buildFrontendMetadata({
      locale,
      title: dict.pages.page_not_found,
      description: dict.pages.page_not_found_desc,
      path: `/${slug}`,
    })
  }

  const media = typeof page.pageImage === 'object' ? page.pageImage : null
  const image = media?.url
    ? {
        url: media.url,
        alt: media.alt ?? undefined,
        width: media.width ?? undefined,
        height: media.height ?? undefined,
      }
    : undefined

  return buildFrontendMetadata({
    locale,
    title: page.seo?.metaTitle || `${page.title} - Plaine Corail Airport`,
    description: page.seo?.metaDescription || page.summary,
    path: `/${slug}`,
    image,
  })
}

export default async function GenericPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const [dict, page] = await Promise.all([
    getDictionary(locale),
    getPageBySlug(slug, locale),
  ])

  if (!page) notFound()

  return (
    <main>
      <PageHero
        eyebrow={dict.pages.eyebrow_airport_info}
        title={page.title}
        summary={page.summary}
      />
      <section className="page-section">
        <div className="container stack-lg">
          <MediaFigure media={page.pageImage} altFallback={page.title} showCaption />
          <SectionList sections={page.sections} />
        </div>
      </section>
    </main>
  )
}
