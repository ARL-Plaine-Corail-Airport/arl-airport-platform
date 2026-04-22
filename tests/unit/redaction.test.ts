import { describe, expect, it } from 'vitest'

import { redactSensitiveText } from '@/lib/redaction'

describe('redaction', () => {
  it('redacts explicit secrets with a single escaped alternation pattern', () => {
    const result = redactSensitiveText(
      'token abc.def? and abc.def? plus longer secret-value-123',
      ['abc.def?', 'secret-value-123'],
    )

    expect(result).toBe('token [REDACTED] and [REDACTED] plus longer [REDACTED]')
  })

  it('ignores very short explicit secrets', () => {
    expect(redactSensitiveText('pin 123 remains', ['123'])).toBe('pin 123 remains')
  })

  it('redacts bare JWT-like tokens in free-form text', () => {
    const token = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFSTCJ9',
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    ].join('.')

    expect(redactSensitiveText(`stack leaked ${token}`)).toBe('stack leaked [REDACTED]')
  })
})
