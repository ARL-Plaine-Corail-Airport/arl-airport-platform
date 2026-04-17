import { afterEach, describe, expect, it, vi } from 'vitest'

const { captureException, captureMessage } = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException,
  captureMessage,
}))

import { logger } from '@/lib/logger'

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    captureException.mockReset()
    captureMessage.mockReset()
  })

  it('logs errors with context prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('Something failed', new Error('boom'), 'test')
    expect(spy).toHaveBeenCalledOnce()
    const msg = spy.mock.calls[0][0] as string
    expect(msg).toContain('[ERROR]')
    expect(msg).toContain('[test]')
    expect(msg).toContain('boom')
    expect(captureException).toHaveBeenCalledOnce()
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { context: 'test' },
      }),
    )
  })

  it('logs errors without an Error object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('Simple failure')
    expect(spy).toHaveBeenCalledOnce()
    const msg = spy.mock.calls[0][0] as string
    expect(msg).toContain('Simple failure')
    expect(captureException).not.toHaveBeenCalled()
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('sends non-Error failures to Sentry as messages', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    logger.error('Simple failure', 'boom', 'test')

    expect(captureException).not.toHaveBeenCalled()
    expect(captureMessage).toHaveBeenCalledOnce()
    expect(captureMessage).toHaveBeenCalledWith(
      'boom',
      expect.objectContaining({
        level: 'error',
        tags: { context: 'test' },
      }),
    )
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
