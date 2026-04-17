import 'server-only'

import type { Metadata } from 'next'

import { locales, type Locale } from '@/i18n/config'
import { localePath } from '@/i18n/path'
import { getSiteSettings } from '@/lib/content'
import { env } from '@/lib/env'

interface MetadataImageInput {
  url: string
  alt?: string
  width?: number
  height?: number
}

interface FrontendMetadataInput {
  locale: Locale
  title: string
  description: string
  path: string
  image?: MetadataImageInput
  robots?: { index: boolean; follow: boolean }
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

function buildAbsoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, env.siteURL).toString()
}

function normalizeImage(
  image?: MetadataImageInput,
): MetadataImageInput | undefined {
  if (!image?.url) return undefined

  return {
    url: buildAbsoluteUrl(image.url),
    ...(image.alt && { alt: image.alt }),
    ...(image.width && { width: image.width }),
    ...(image.height && { height: image.height }),
  }
}

export async function buildFrontendMetadata(
  input: FrontendMetadataInput,
): Promise<Metadata> {
  const site = await getSiteSettings(input.locale)
  const canonicalPath = localePath(input.path, input.locale)
  const canonical = buildAbsoluteUrl(canonicalPath)
  const ogType = input.type ?? 'website'

  const defaultOgMedia =
    typeof site.defaultOgImage === 'object' ? site.defaultOgImage : null
  const fallbackImage = normalizeImage(
    defaultOgMedia?.url
      ? {
          url: defaultOgMedia.url,
          alt: defaultOgMedia.alt ?? undefined,
          width: defaultOgMedia.width ?? undefined,
          height: defaultOgMedia.height ?? undefined,
        }
      : undefined,
  )
  const image = normalizeImage(input.image) ?? fallbackImage
  const siteName = site.siteName ?? 'Airport of Rodrigues Ltd'

  const languages = locales.reduce<Record<string, string>>((acc, locale) => {
    acc[locale] = buildAbsoluteUrl(localePath(input.path, locale))
    return acc
  }, {})
  languages['x-default'] = buildAbsoluteUrl(localePath(input.path, 'en'))

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    metadataBase: new URL(env.siteURL),
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName,
      type: ogType,
      ...(ogType === 'article' && {
        ...(input.publishedTime && { publishedTime: input.publishedTime }),
        ...(input.modifiedTime && { modifiedTime: input.modifiedTime }),
      }),
      ...(image && { images: [image] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      ...(image && { images: [image.url] }),
    },
  }

  if (input.robots) {
    metadata.robots = {
      index: input.robots.index,
      follow: input.robots.follow,
    }
  }

  return metadata
}
