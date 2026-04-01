import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

/**
 * Renders a Payload CMS Lexical richText field.
 * Falls back gracefully if data is a plain string (legacy content)
 * or null/undefined.
 */
export function RichText({ data, className }: { data: any; className?: string }) {
  if (!data) return null

  // Legacy plain-string content (pre-richText migration)
  if (typeof data === 'string') {
    return (
      <div className={className}>
        {data
          .split(/\n{2,}/g)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
      </div>
    )
  }

  return <PayloadRichText data={data} className={className} />
}
