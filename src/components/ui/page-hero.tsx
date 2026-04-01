type PageHeroProps = {
  eyebrow?: string
  title: string
  summary: string
  /** Optional meta line displayed below the summary on the home hero */
  meta?: string
  /** When true renders the full gradient home-page hero; otherwise a plain inner-page style */
  variant?: 'home' | 'inner'
}

export function PageHero({ eyebrow, title, summary, meta, variant = 'inner' }: PageHeroProps) {
  if (variant === 'inner') {
    return (
      <section className="inner-page-hero">
        <div className="container">
          <div className="inner-page-hero__content">
            {eyebrow && <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>{eyebrow}</p>}
            <h1>{title}</h1>
            {summary && <p className="lead" style={{ marginTop: '0.5rem' }}>{summary}</p>}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-hero">
      <div className="container">
        <div className="page-hero__content">
          <div className="hero-eyebrow">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.5 7.3c.3.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
            </svg>
            <span>{eyebrow}</span>
          </div>

          <h1>{title}</h1>

          <p className="hero-summary">{summary}</p>

          {meta && (
            <p className="hero-meta">{meta}</p>
          )}
        </div>
      </div>
    </section>
  )
}
