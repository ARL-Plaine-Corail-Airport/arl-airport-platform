import { afterEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/lib/logger'

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs errors with context prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('Something failed', new Error('boom'), 'test')
    expect(spy).toHaveBeenCalledOnce()
    const msg = spy.mock.calls[0][0] as string
    expect(msg).toContain('[ERROR]')
    expect(msg).toContain('[test]')
    expect(msg).toContain('boom')
  })

  it('logs errors without an Error object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('Simple failure')
    expect(spy).toHaveBeenCalledOnce()
    const msg = spy.mock.calls[0][0] as string
    expect(msg).toContain('Simple failure')
  })

  it('logs warnings', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('Watch out', 'auth')
    expect(spy).toHaveBeenCalledOnce()
    const msg = spy.mock.calls[0][0] as string
    expect(msg).toContain('[WARN]')
    expect(msg).toContain('[auth]')
  })

  it('logs info messages', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('All good', 'startup')
    expect(spy).toHaveBeenCalledOnce()
    const msg = spy.mock.calls[0][0] as string
    expect(msg).toContain('[INFO]')
    expect(msg).toContain('[startup]')
  })
})
