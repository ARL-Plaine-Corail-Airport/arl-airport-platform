// Simple structured logger for server-side error tracking.
// In production, replace console.error with a log aggregation service
// (e.g. Sentry, Datadog, Axiom) by changing the `output` function.

type LogLevel = 'error' | 'warn' | 'info'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  error?: unknown
  timestamp: string
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

function output(entry: LogEntry) {
  const prefix = `[${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}`
  const msg = `${prefix} ${entry.message}`

  if (entry.level === 'error') {
    console.error(msg, entry.error instanceof Error ? entry.error.stack : '')
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
