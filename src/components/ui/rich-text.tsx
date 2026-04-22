import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

function paragraphHash(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

/**
 * Renders a Payload CMS Lexical richText field.
 * Falls back gracefully if data is a plain string (legacy content)
 * or null/undefined.
 */
export function RichText({ data, className }: { data: any; className?: string }) {
  if (!data) return null

  const resolvedClassName = ['rich-text', className].filter(Boolean).join(' ')

  // Legacy plain-string content (pre-richText migration)
  if (typeof data === 'string') {
    const paragraphCounts = new Map<string, number>()
    const paragraphs = data
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean)

    return (
      <div className={resolvedClassName}>
        {paragraphs.map((paragraph) => {
          const occurrence = paragraphCounts.get(paragraph) ?? 0
          paragraphCounts.set(paragraph, occurrence + 1)

          return <p key={`${paragraphHash(paragraph)}-${occurrence}`}>{paragraph}</p>
        })}
      </div>
    )
  }

  // Trust boundary: Payload's Lexical React renderer escapes text nodes by default;
  // the configured richText fields do not enable raw HTML nodes.
  return <PayloadRichText data={data} className={resolvedClassName} />
}
