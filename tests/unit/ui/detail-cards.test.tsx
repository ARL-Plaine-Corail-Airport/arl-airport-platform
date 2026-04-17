import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DetailCards } from '@/components/ui/detail-cards'

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('DetailCards', () => {
  it('renders the empty state message when there are no items', () => {
    render(<DetailCards items={[]} />)

    expect(screen.getByText('labels.no_records')).toBeInTheDocument()
  })

  it('renders one article per item', () => {
    const { container } = render(
      <DetailCards
        items={[
          { id: 'phone', title: 'Phone', value: '+230 0000', link: 'tel:+2300000' },
          { id: 'email', title: 'Email', value: 'info@example.com', link: 'mailto:info@example.com' },
        ]}
      />,
    )

    expect(container.querySelectorAll('article')).toHaveLength(2)
  })

  it('does not force tel links into a new tab', () => {
    render(<DetailCards items={[{ id: 'phone', title: 'Phone', value: 'Call', link: 'tel:+2300000' }]} />)

    const link = screen.getByRole('link', { name: 'labels.call' })
    expect(link).toHaveAttribute('href', 'tel:+2300000')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  it('does not force mailto links into a new tab', () => {
    render(
      <DetailCards
        items={[{ id: 'email', title: 'Email', value: 'Mail', link: 'mailto:info@example.com' }]}
      />,
    )

    const link = screen.getByRole('link', { name: 'labels.send_email' })
    expect(link).toHaveAttribute('href', 'mailto:info@example.com')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  it('marks external links as new-tab links', () => {
    render(
      <DetailCards
        items={[{ id: 'website', title: 'Website', value: 'Open', link: 'https://airport.example.com' }]}
      />,
    )

    const link = screen.getByRole('link', {
      name: 'labels.open_link (opens in new tab)',
    })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders null item fields without crashing', () => {
    const { container } = render(
      <DetailCards items={[{ id: 'empty', title: null, value: null, link: null }]} />,
    )

    expect(container.querySelectorAll('article')).toHaveLength(1)
    expect(container.querySelector('a')).toBeNull()
  })

  it('renders title and value without a link when link is omitted', () => {
    const { container } = render(
      <DetailCards items={[{ id: 'desk', title: 'Desk', value: 'Open daily' }]} />,
    )

    expect(screen.getByText('Desk')).toBeInTheDocument()
    expect(screen.getByText('Open daily')).toBeInTheDocument()
    expect(container.querySelector('a')).toBeNull()
  })
})
