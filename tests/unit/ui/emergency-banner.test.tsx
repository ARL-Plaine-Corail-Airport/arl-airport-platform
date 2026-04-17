import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EmergencyBanner } from '@/components/ui/emergency-banner'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode
    href: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('EmergencyBanner', () => {
  it('returns null when both title and summary are empty', () => {
    const { container } = render(
      <EmergencyBanner href="/notices/emergency" title="" summary="" />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders the title text when provided', () => {
    render(
      <EmergencyBanner
        href="/notices/emergency"
        title="Runway closure"
        summary="Check before travel"
      />,
    )

    expect(screen.getByText('Runway closure')).toBeInTheDocument()
  })

  it('falls back to summary text when title is missing', () => {
    render(
      <EmergencyBanner href="/notices/emergency" summary="Check before travel" />,
    )

    expect(screen.getByText('Check before travel')).toBeInTheDocument()
  })

  it('renders as a status link with accessible live region semantics', () => {
    render(
      <EmergencyBanner
        href="/notices/emergency"
        title="Runway closure"
        summary="Check before travel"
      />,
    )

    const banner = screen.getByRole('status')
    expect(banner).toHaveAttribute('aria-live', 'polite')

    const link = screen.getByRole('link', { name: /Runway closure/ })
    expect(link).toHaveAttribute('href', '/notices/emergency')
  })

  it('contains a warning svg icon inside the banner', () => {
    render(
      <EmergencyBanner
        href="/notices/emergency"
        title="Runway closure"
        summary="Check before travel"
      />,
    )

    const banner = screen.getByRole('status')
    expect(banner.querySelector('svg')).not.toBeNull()
  })
})
