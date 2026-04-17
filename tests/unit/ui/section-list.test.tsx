import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SectionList } from '@/components/ui/section-list'

vi.mock('@/i18n/provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/components/ui/rich-text', () => ({
  RichText: ({ data }: { data: any }) => (
    <div data-testid="rich-text">
      {typeof data === 'string' ? data : 'rich-text-content'}
    </div>
  ),
}))

describe('SectionList', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the empty state message when sections are empty or null', () => {
    const { rerender } = render(<SectionList sections={[]} />)

    expect(screen.getByText('labels.no_sections')).toBeInTheDocument()

    rerender(<SectionList sections={null as any} />)

    expect(screen.getByText('labels.no_sections')).toBeInTheDocument()
  })

  it('renders section elements, headings, ids, and numbered indices', () => {
    const { container } = render(
      <SectionList
        sections={[
          { heading: 'Safety Rules', body: 'Be safe' },
          { heading: 'Terminal Access', body: 'Use badges' },
        ]}
      />,
    )

    const sections = container.querySelectorAll('section.content-section')
    expect(sections).toHaveLength(2)
    expect(screen.getByRole('heading', { level: 2, name: 'Safety Rules' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Terminal Access' })).toBeInTheDocument()
    expect(container.querySelector('#safety-rules-1')).not.toBeNull()
    expect(container.querySelector('#terminal-access-2')).not.toBeNull()

    const numbers = Array.from(container.querySelectorAll('.content-section__number')).map(
      (node) => node.textContent,
    )
    expect(numbers).toContain('01')
    expect(numbers).toContain('02')
  })

  it('shows quick links when more than one section is provided and hides them for one section', () => {
    const { rerender } = render(
      <SectionList
        sections={[
          { heading: 'Safety Rules', body: 'Be safe' },
          { heading: 'Terminal Access', body: 'Use badges' },
        ]}
      />,
    )

    expect(screen.getByRole('navigation', { name: 'nav.quick_links' })).toBeInTheDocument()

    rerender(<SectionList sections={[{ heading: 'Safety Rules', body: 'Be safe' }]} />)

    expect(screen.queryByRole('navigation', { name: 'nav.quick_links' })).toBeNull()
  })

  it('renders bullet items only when bullets are provided', () => {
    const { container, rerender } = render(
      <SectionList
        sections={[
          {
            heading: 'Safety Rules',
            body: 'Be safe',
            bullets: [{ text: 'Wear a badge' }, { text: 'Follow signage' }],
          },
        ]}
      />,
    )

    expect(screen.getByText('Wear a badge')).toBeInTheDocument()
    expect(screen.getByText('Follow signage')).toBeInTheDocument()
    expect(container.querySelectorAll('ul.content-list')).toHaveLength(1)

    rerender(
      <SectionList
        sections={[
          {
            heading: 'Safety Rules',
            body: 'Be safe',
            bullets: [],
          },
        ]}
      />,
    )

    expect(container.querySelector('ul.content-list')).toBeNull()
  })
})
