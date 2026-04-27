import * as Sentry from '@sentry/nextjs'

import { redactSensitiveData } from './src/lib/redaction'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_BUILD_VERSION || undefined,
    beforeSend: (event) => redactSensitiveData(event),
    beforeBreadcrumb: (breadcrumb) => redactSensitiveData(breadcrumb),
  })
}
