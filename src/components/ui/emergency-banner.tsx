import Link from 'next/link'

type EmergencyBannerProps = {
  title?: string
  summary?: string
  href: string
}

export function EmergencyBanner({ title, summary, href }: EmergencyBannerProps) {
  const text = title || summary
  if (!text) return null

  return (
    <div className="urgent-banner" role="status" aria-live="polite">
      <div className="container">
        <Link href={href} className="urgent-banner__inner">
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </span>
          <svg
            className="urgent-banner__chevron"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
