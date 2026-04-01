type MediaSizeName = 'thumbnail' | 'card' | 'hero'

type MediaVariant = {
  url?: string | null
  width?: number | null
  height?: number | null
}

type MediaLike = {
  alt?: string | null
  caption?: string | null
  filename?: string | null
  url?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<MediaSizeName, MediaVariant>> | null
}

const DEFAULT_MEDIA_WIDTH = 1600
const DEFAULT_MEDIA_HEIGHT = 900

export function getMediaSource(
  media: unknown,
  preferredSize: MediaSizeName = 'hero',
  fallbackAlt = '',
) {
  if (!media || typeof media !== 'object') {
    return null
  }

  const asset = media as MediaLike
  const size = asset.sizes?.[preferredSize]
  const src = size?.url ?? asset.url

  if (!src) {
    return null
  }

  return {
    src,
    alt: asset.alt || fallbackAlt || asset.filename || 'Image',
    caption: asset.caption ?? null,
    width: size?.width ?? asset.width ?? DEFAULT_MEDIA_WIDTH,
    height: size?.height ?? asset.height ?? DEFAULT_MEDIA_HEIGHT,
  }
}
