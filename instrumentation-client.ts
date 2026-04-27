import * as Sentry from '@sentry/nextjs'

import { redactSensitiveData } from './src/lib/redaction'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_BUILD_VERSION || undefined,
    integrations: [Sentry.replayIntegration()],
    beforeSend: (event) => redactSensitiveData(event),
    beforeBreadcrumb: (breadcrumb) => redactSensitiveData(breadcrumb),
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
