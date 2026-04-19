import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV ?? 'development',
  beforeSend(event) {
    // Don't send client errors (4xx) — those are user errors, not bugs
    const status = event.contexts?.response?.status_code as number | undefined;
    if (status && status < 500) return null;
    return event;
  },
});
