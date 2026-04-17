import * as Sentry from '@sentry/nextjs'

import { redactSensitiveData } from './src/lib/redaction'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_SITE_URL,
    beforeSend: (event) => redactSensitiveData(event),
    beforeBreadcrumb: (breadcrumb) => redactSensitiveData(breadcrumb),
  })
}
