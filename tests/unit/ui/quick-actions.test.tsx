import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { QuickActions } from '@/components/ui/quick-actions'

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    localePath: (path: string) => `/en${path}`,
  }),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    ...props
  }: {
    children: ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}))

describe('QuickActions', () => {
  it('renders exactly six navigation links with the expected localized paths', () => {
    render(<QuickActions />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(6)
    expect(links[0]).toHaveAttribute('href', '/en/arrivals')
    expect(links[1]).toHaveAttribute('href', '/en/departures')
    expect(links[2]).toHaveAttribute('href', '/en/notices')
    expect(links[3]).toHaveAttribute('href', '/en/transport-parking')
    expect(links[4]).toHaveAttribute('href', '/en/contact')
    expect(links[5]).toHaveAttribute('href', '/en/airport-map')
  })

  it('marks the first two cards as primary and leaves the others unstyled', () => {
    render(<QuickActions />)

    const links = screen.getAllByRole('link')

    expect(links[0]).toHaveClass('quick-action-card--primary')
    expect(links[1]).toHaveClass('quick-action-card--primary')
    expect(links[2]).not.toHaveClass('quick-action-card--primary')
    expect(links[3]).not.toHaveClass('quick-action-card--primary')
    expect(links[4]).not.toHaveClass('quick-action-card--primary')
    expect(links[5]).not.toHaveClass('quick-action-card--primary')
  })

  it('renders svg icons and i18n title keys for each card', () => {
    const { container } = render(<QuickActions />)

    const links = screen.getAllByRole('link')
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)

    expect(screen.getByText('quick_actions.arrivals')).toBeInTheDocument()
    expect(screen.getByText('quick_actions.departures')).toBeInTheDocument()
    expect(screen.getByText('quick_actions.notices')).toBeInTheDocument()
    expect(screen.getByText('quick_actions.transport')).toBeInTheDocument()
    expect(screen.getByText('quick_actions.contact')).toBeInTheDocument()
    expect(screen.getByText('quick_actions.map')).toBeInTheDocument()

    links.forEach((link) => {
      expect(link.querySelector('svg')).not.toBeNull()
    })
  })
})
