import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PageHero } from '@/components/ui/page-hero'

vi.mock('next/image', () => ({
  default: () => null,
}))

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

describe('PageHero', () => {
  it('renders eyebrow text, title, and summary', () => {
    render(
      <PageHero
        eyebrow="Passenger services"
        title="Passenger Guide"
        summary="Everything passengers need before travel."
      />,
    )

    expect(screen.getByText('Passenger services')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Passenger Guide' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Everything passengers need before travel.'),
    ).toBeInTheDocument()
  })

  it('handles missing optional text without crashing', () => {
    render(<PageHero title="Airport Map" summary="" />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Airport Map' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Passenger services')).not.toBeInTheDocument()
  })

  it('uses semantic section and h1 elements for the inner variant', () => {
    const { container } = render(
      <PageHero title="Contact" summary="Reach the airport team." />,
    )

    expect(container.querySelector('section.inner-page-hero')).not.toBeNull()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })
})
