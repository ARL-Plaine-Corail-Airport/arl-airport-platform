import Image from 'next/image'
import Link from 'next/link'

type HeroInsight = {
  href?: string
  label: string
  meta?: string
  tone?: 'alert' | 'aurora' | 'default' | 'sky'
  value: string
}

type PageHeroProps = {
  ctaHref?: string
  ctaLabel?: string
  eyebrow?: string
  insights?: HeroInsight[]
  meta?: string
  secondaryCtaHref?: string
  secondaryCtaLabel?: string
  summary: string
  title: string
  variant?: 'home' | 'inner'
}

function HeroInsightCard({ insight }: { insight: HeroInsight }) {
  const className = `hero-glance__card hero-glance__card--${insight.tone ?? 'default'}`

  const content = (
    <>
      <p className="hero-glance__label">{insight.label}</p>
      <p className="hero-glance__value">{insight.value}</p>
      {insight.meta ? <p className="hero-glance__meta">{insight.meta}</p> : null}
    </>
  )

  if (insight.href) {
    return (
      <Link href={insight.href} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

export function PageHero({
  ctaHref,
  ctaLabel,
  eyebrow,
  insights,
  meta,
  secondaryCtaHref,
  secondaryCtaLabel,
  summary,
  title,
  variant = 'inner',
}: PageHeroProps) {
  if (variant === 'inner') {
    return (
      <section className="inner-page-hero">
        <div className="container">
          <div className="inner-page-hero__shell">
            <div className="inner-page-hero__content">
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h1>{title}</h1>
              {summary ? <p className="lead">{summary}</p> : null}
              {meta ? <p className="hero-meta">{meta}</p> : null}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-hero">
      <Image
        src="/images/hero-terminal.jpg"
        alt="Plaine Corail Airport terminal building"
        fill
        priority
        sizes="100vw"
        className="page-hero__bg"
      />
      <div className="page-hero__overlay" />
      <div className="page-hero__gridlines" aria-hidden="true" />
      <div className="container">
        <div className={`page-hero__shell${insights?.length ? ' page-hero__shell--split' : ''}`}>
          <div className="page-hero__content">
            {eyebrow ? <p className="hero-eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {summary ? <p className="hero-summary">{summary}</p> : null}

            {(ctaLabel && ctaHref) || (secondaryCtaLabel && secondaryCtaHref) ? (
              <div className="hero-actions">
                {ctaLabel && ctaHref ? (
                  <Link href={ctaHref} className="hero-cta hero-cta--primary">
                    {ctaLabel}
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                ) : null}
                {secondaryCtaLabel && secondaryCtaHref ? (
                  <Link href={secondaryCtaHref} className="hero-cta hero-cta--secondary">
                    {secondaryCtaLabel}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {meta ? <p className="hero-meta">{meta}</p> : null}
          </div>

          {insights?.length ? (
            <div className="hero-glance" aria-label={eyebrow ?? title}>
              {insights.map((insight) => (
                <HeroInsightCard key={`${insight.label}-${insight.value}`} insight={insight} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
