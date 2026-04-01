'use client'

import type { ElementType, HTMLAttributes, ReactNode } from 'react'

type ProtectedImageFrameProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  children: ReactNode
  watermark?: string | null
}

function preventInteraction(event: {
  preventDefault: () => void
}) {
  event.preventDefault()
}

export function ProtectedImageFrame({
  as: Tag = 'div',
  children,
  className,
  watermark = null,
  ...props
}: ProtectedImageFrameProps) {
  return (
    <Tag
      {...props}
      className={['protected-image-frame', className].filter(Boolean).join(' ')}
      onContextMenu={preventInteraction}
      onDragStart={preventInteraction}
      onCopy={preventInteraction}
      onCut={preventInteraction}
      data-watermark={watermark || undefined}
    >
      {children}
      <span className="protected-image-frame__shield" aria-hidden="true" />
      {watermark ? (
        <span className="protected-image-frame__watermark" aria-hidden="true">
          {watermark}
        </span>
      ) : null}
    </Tag>
  )
}
