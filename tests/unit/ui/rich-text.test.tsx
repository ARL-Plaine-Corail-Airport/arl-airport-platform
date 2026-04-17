import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RichText } from '@/components/ui/rich-text'

vi.mock('@payloadcms/richtext-lexical/react', () => ({
  RichText: ({ data, className }: { data: any; className?: string }) => (
    <div data-testid="payload-richtext" className={className}>
      lexical-content
    </div>
  ),
}))

describe('RichText', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when data is null or undefined', () => {
    const { container, rerender } = render(<RichText data={null} />)

    expect(container.firstChild).toBeNull()

    rerender(<RichText data={undefined} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders plain string content as paragraphs split on double newlines', () => {
    const { container } = render(<RichText data={'First paragraph\n\nSecond paragraph'} />)

    expect(container.querySelectorAll('p')).toHaveLength(2)
    expect(container).toHaveTextContent('First paragraph')
    expect(container).toHaveTextContent('Second paragraph')
  })

  it('renders duplicate paragraphs without key collisions', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = render(<RichText data={'Same paragraph\n\nSame paragraph'} />)

    expect(container.querySelectorAll('p')).toHaveLength(2)
    expect(container).toHaveTextContent('Same paragraph')
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('passes lexical data objects to the Payload RichText component', () => {
    const { getByTestId } = render(<RichText data={{ root: { children: [] } }} />)

    expect(getByTestId('payload-richtext')).toBeInTheDocument()
  })

  it('applies custom class names alongside the base class', () => {
    const { getByTestId } = render(<RichText data={{ root: { children: [] } }} className="prose" />)

    expect(getByTestId('payload-richtext')).toHaveClass('rich-text')
    expect(getByTestId('payload-richtext')).toHaveClass('prose')
  })

  it('renders only the base class when no custom class name is provided', () => {
    const { getByTestId } = render(<RichText data={{ root: { children: [] } }} />)

    expect(getByTestId('payload-richtext')).toHaveClass('rich-text')
    expect(getByTestId('payload-richtext')).not.toHaveClass('prose')
  })
})
