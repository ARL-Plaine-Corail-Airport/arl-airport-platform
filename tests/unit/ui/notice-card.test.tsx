import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NoticeCard } from '@/components/ui/notice-card'

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    localePath: (path: string) => `/en${path}`,
    locale: 'en',
  }),
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

vi.mock('@/lib/date', () => ({
  formatDateTime: (date: string) => `formatted:${date}`,
}))

describe('NoticeCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the notice title in an h3 element', () => {
    render(
      <NoticeCard
        notice={{
          id: '1',
          slug: 'airport-update',
          title: 'Airport Update',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { level: 3, name: 'Airport Update' }),
    ).toBeInTheDocument()
  })

  it('renders summary text when provided and omits it when missing', () => {
    const { container, rerender } = render(
      <NoticeCard
        notice={{
          id: '1',
          slug: 'airport-update',
          title: 'Airport Update',
          summary: 'Runway works are complete.',
        }}
      />,
    )

    expect(screen.getByText('Runway works are complete.')).toBeInTheDocument()

    rerender(
      <NoticeCard
        notice={{
          id: '1',
          slug: 'airport-update',
          title: 'Airport Update',
          summary: null,
        }}
      />,
    )

    expect(screen.queryByText('Runway works are complete.')).not.toBeInTheDocument()
    expect(container.querySelector('.notice-card__summary')).toBeNull()
  })

  it('renders category, urgent, and pinned indicators', () => {
    render(
      <NoticeCard
        notice={{
          id: '1',
          slug: 'airport-update',
          title: 'Airport Update',
          category: 'operations',
          urgent: true,
          pinned: true,
        }}
      />,
    )

    expect(screen.getByText('operations')).toBeInTheDocument()
    expect(screen.getByText('labels.urgent')).toHaveClass('pill--danger')
    expect(screen.getByText('labels.pinned')).toBeInTheDocument()
  })

  it('links to the localized notice path', () => {
    render(
      <NoticeCard
        notice={{
          id: '1',
          slug: 'airport-update',
          title: 'Airport Update',
        }}
      />,
    )

    const link = screen.getByRole('link', { name: /Airport Update/ })
    expect(link).toHaveAttribute('href', '/en/notices/airport-update')
  })

  it('renders the formatted publish date when provided and omits it when missing', () => {
    const { rerender } = render(
      <NoticeCard
        notice={{
          id: '1',
          slug: 'airport-update',
          title: 'Airport Update',
          publishedAt: '2024-01-01T12:00:00Z',
        }}
      />,
    )

    expect(screen.getByText('formatted:2024-01-01T12:00:00Z')).toBeInTheDocument()

    rerender(
      <NoticeCard
        notice={{
          id: '1',
          slug: 'airport-update',
          title: 'Airport Update',
          publishedAt: null,
        }}
      />,
    )

    expect(screen.queryByText('formatted:2024-01-01T12:00:00Z')).not.toBeInTheDocument()
  })
})
