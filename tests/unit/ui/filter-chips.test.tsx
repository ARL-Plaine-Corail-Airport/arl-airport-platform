import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FilterChips } from '@/components/ui/filter-chips'

let mockSearchParams = new URLSearchParams()

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

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

describe('FilterChips', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an all chip that links to the base path', () => {
    render(
      <FilterChips
        paramName="type"
        basePath="/notices"
        options={[
          { value: 'urgent', label: 'Urgent' },
          { value: 'info', label: 'Info' },
        ]}
      />,
    )

    const allChip = screen.getByRole('link', { name: 'labels.all' })
    expect(allChip).toHaveAttribute('href', '/en/notices')
  })

  it('renders one chip per option with the correct labels', () => {
    render(
      <FilterChips
        paramName="type"
        basePath="/notices"
        options={[
          { value: 'urgent', label: 'Urgent' },
          { value: 'info', label: 'Info' },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Urgent' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Info' })).toBeInTheDocument()
  })

  it('marks the all chip active when no query param is selected', () => {
    render(
      <FilterChips
        paramName="type"
        basePath="/notices"
        options={[{ value: 'urgent', label: 'Urgent' }]}
      />,
    )

    expect(screen.getByRole('link', { name: 'labels.all' })).toHaveClass(
      'filter-chip--active',
    )
  })

  it('marks the matching option active when the query param is selected', () => {
    mockSearchParams = new URLSearchParams('type=urgent')

    render(
      <FilterChips
        paramName="type"
        basePath="/notices"
        options={[
          { value: 'urgent', label: 'Urgent' },
          { value: 'info', label: 'Info' },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Urgent' })).toHaveClass(
      'filter-chip--active',
    )
    expect(screen.getByRole('link', { name: 'labels.all' })).not.toHaveClass(
      'filter-chip--active',
    )
  })

  it('renders the chips inside an accessible group container', () => {
    render(
      <FilterChips
        paramName="type"
        basePath="/notices"
        options={[{ value: 'urgent', label: 'Urgent' }]}
      />,
    )

    expect(screen.getByRole('group', { name: 'Filter' })).toBeInTheDocument()
  })
})
