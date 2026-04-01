import { describe, expect, it } from 'vitest'

import { splitParagraphs } from '@/lib/text'

describe('splitParagraphs', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(splitParagraphs(null)).toEqual([])
    expect(splitParagraphs(undefined)).toEqual([])
    expect(splitParagraphs('')).toEqual([])
  })

  it('splits on double newlines', () => {
    const result = splitParagraphs('Hello\n\nWorld')
    expect(result).toEqual(['Hello', 'World'])
  })

  it('preserves single newlines within paragraphs', () => {
    const result = splitParagraphs('Hello\nWorld')
    expect(result).toEqual(['Hello\nWorld'])
  })

  it('trims whitespace and filters blank parts', () => {
    const result = splitParagraphs('  Hello  \n\n\n\n  World  \n\n')
    expect(result).toEqual(['Hello', 'World'])
  })
})
