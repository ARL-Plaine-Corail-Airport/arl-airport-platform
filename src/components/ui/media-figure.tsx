import Image from 'next/image'

import { getMediaSource } from '@/lib/media'
import { ProtectedImageFrame } from '@/components/ui/protected-image-frame'

type MediaFigureProps = {
  media: unknown
  altFallback?: string
  className?: string
  priority?: boolean
  showCaption?: boolean
  size?: 'thumbnail' | 'card' | 'hero'
  variant?: 'card' | 'hero'
}

const sizeHints = {
  card: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, calc(100vw - 2rem)',
  hero: '(min-width: 1024px) 1120px, calc(100vw - 2rem)',
} as const

export function MediaFigure({
  media,
  altFallback,
  className,
  priority = false,
  showCaption = false,
  size = 'hero',
  variant = 'hero',
}: MediaFigureProps) {
  const source = getMediaSource(media, size, altFallback)

  if (!source) {
    return null
  }

  return (
    <figure className={['site-media', `site-media--${variant}`, className].filter(Boolean).join(' ')}>
      <ProtectedImageFrame className="site-media__frame">
        <Image
          src={source.src}
          alt={source.alt}
          fill
          className="site-media__image"
          draggable={false}
          priority={priority}
          sizes={sizeHints[variant]}
        />
      </ProtectedImageFrame>
      {showCaption && source.caption ? (
        <figcaption className="site-media__caption">{source.caption}</figcaption>
      ) : null}
    </figure>
  )
}
