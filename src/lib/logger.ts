// Simple structured logger for server-side error tracking.
// In production, replace console.error with a log aggregation service
// (e.g. Sentry, Datadog, Axiom) by changing the `output` function.

import * as Sentry from '@sentry/nextjs'

import { redactSensitiveText } from '@/lib/redaction'

type LogLevel = 'error' | 'warn' | 'info'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  error?: unknown
  timestamp: string
}

function formatError(error: unknown): string {
  if (error instanceof Error) return redactSensitiveText(error.message)
  if (typeof error === 'string') return redactSensitiveText(error)
  return 'Unknown error'
}

function output(entry: LogEntry) {
  const prefix = `[${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}`
  const msg = redactSensitiveText(`${prefix} ${entry.message}`)

  if (entry.level === 'error') {
    if (entry.error instanceof Error) {
      console.error(msg, entry.error)
    } else if (entry.error !== undefined) {
      console.error(msg, redactSensitiveText(String(entry.error)))
    } else {
      console.error(msg)
    }
  } else if (entry.level === 'warn') {
    console.warn(msg)
  } else {
    console.info(msg)
  }
}

export const logger = {
  error(message: string, error?: unknown, context?: string) {
    output({
      level: 'error',
      message: `${message}${error ? `: ${formatError(error)}` : ''}`,
      context,
      error,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: context ? { context } : undefined,
      })
    } else if (error !== undefined) {
      Sentry.captureMessage(redactSensitiveText(String(error)), {
        level: 'error',
        tags: context ? { context } : undefined,
      })
    }
  },

  warn(message: string, context?: string) {
    output({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString(),
    })
  },

  info(message: string, context?: string) {
    output({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    })
  },
}
