/**
 * Sentry configuration for server-side error tracking
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Set user context
  beforeSend(event, hint) {
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production' && event.exception) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Filter out common development errors
        if (error.message.includes('ECONNREFUSED')) {
          return null;
        }
        if (error.message.includes('ENOTFOUND')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Add custom tags
  initialScope: {
    tags: {
      component: 'server',
      environment: process.env.NODE_ENV,
    },
  },
});
