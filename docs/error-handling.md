# Error Handling & Logging System

## Overview

The error handling system provides comprehensive error tracking, user-friendly error boundaries, and structured logging with Sentry integration for production monitoring.

## Features

- ✅ **Global Error Boundary** with friendly fallback UI
- ✅ **Structured Logging** with console (dev) and Sentry (prod)
- ✅ **Error Recovery** with retry mechanisms
- ✅ **User Feedback** with error reporting
- ✅ **Performance Monitoring** with timing metrics
- ✅ **TypeScript Support** with full type safety

## Architecture

```
src/lib/logger.ts                    # Core logging system
src/components/GlobalErrorBoundary.tsx # Error boundary component
sentry.client.config.ts              # Sentry client configuration
sentry.server.config.ts              # Sentry server configuration
next.config.js                       # Next.js with Sentry integration
```

## Components

### 1. Global Error Boundary

**File**: `src/components/GlobalErrorBoundary.tsx`

**Features**:
- Catches all unhandled React errors
- Friendly fallback UI with retry options
- Error ID generation for support
- Development error details
- User reporting mechanism

**Usage**:
```tsx
import GlobalErrorBoundary from '../src/components/GlobalErrorBoundary';

// Wrap your app
<GlobalErrorBoundary>
  <App />
</GlobalErrorBoundary>

// Or wrap specific components
<GlobalErrorBoundary fallback={<CustomErrorUI />}>
  <RiskyComponent />
</GlobalErrorBoundary>
```

### 2. Logger System

**File**: `src/lib/logger.ts`

**Features**:
- Console logging in development
- Sentry integration in production
- Structured logging with context
- Performance monitoring
- User action tracking

**Usage**:
```typescript
import { logger, useLogger } from '../src/lib/logger';

// Direct usage
logger.info('User logged in', { userId: '123' });
logger.error('API call failed', error, { component: 'LoginForm' });

// React hook usage
function MyComponent() {
  const logger = useLogger('MyComponent');
  
  logger.info('Component mounted');
  logger.userAction('button_clicked', 'MyComponent', { button: 'submit' });
}
```

## Integration Points

### 1. App Root Integration

**File**: `app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <GlobalErrorBoundary>
          <ToastProvider>
            <OfflineBar />
            {children}
            <DevFooter />
          </ToastProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
```

### 2. Sentry Configuration

**Client Config**: `sentry.client.config.ts`
**Server Config**: `sentry.server.config.ts`

```typescript
// Automatic error capture
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: process.env.NODE_ENV === 'development',
});
```

### 3. Environment Variables

**File**: `.env.example`

```bash
# Error Tracking & Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

## Usage Examples

### 1. Basic Error Boundary

```tsx
import GlobalErrorBoundary from '../src/components/GlobalErrorBoundary';

function App() {
  return (
    <GlobalErrorBoundary>
      <MyApp />
    </GlobalErrorBoundary>
  );
}
```

### 2. Component-Level Error Boundary

```tsx
import { withErrorBoundary } from '../src/components/GlobalErrorBoundary';

const RiskyComponent = () => {
  // Component that might throw errors
  return <div>Risky content</div>;
};

export default withErrorBoundary(RiskyComponent, {
  onError: (error, errorInfo) => {
    console.log('Component error:', error);
  }
});
```

### 3. Error Boundary Hook

```tsx
import { useErrorBoundary } from '../src/components/GlobalErrorBoundary';

function MyComponent() {
  const { captureError, resetError } = useErrorBoundary();
  
  const handleAsyncError = async () => {
    try {
      await riskyAsyncOperation();
    } catch (error) {
      captureError(error);
    }
  };
  
  return (
    <div>
      <button onClick={handleAsyncError}>Risky Operation</button>
      <button onClick={resetError}>Reset Error</button>
    </div>
  );
}
```

### 4. Logger Usage

```typescript
import { useLogger } from '../src/hooks/useNetwork';

function MyComponent() {
  const logger = useLogger('MyComponent');
  
  useEffect(() => {
    logger.info('Component mounted');
    
    return () => {
      logger.info('Component unmounted');
    };
  }, []);
  
  const handleClick = () => {
    logger.userAction('button_clicked', 'MyComponent', { 
      button: 'submit',
      timestamp: Date.now() 
    });
  };
  
  const handleApiCall = async () => {
    const start = performance.now();
    try {
      const response = await fetch('/api/data');
      const duration = performance.now() - start;
      
      logger.apiCall('GET', '/api/data', response.status, duration);
    } catch (error) {
      logger.networkError(error as Error, '/api/data', 'GET');
    }
  };
}
```

### 5. Performance Logging

```typescript
import { logger } from '../src/lib/logger';

// Log performance metrics
const start = performance.now();
await expensiveOperation();
const duration = performance.now() - start;

logger.performance('expensive_operation', duration, {
  operation: 'data_processing',
  recordCount: 1000,
  success: true
});
```

## Error Recovery

### 1. Retry Mechanism

The error boundary includes a retry mechanism with configurable limits:

```tsx
<GlobalErrorBoundary maxRetries={3}>
  <App />
</GlobalErrorBoundary>
```

### 2. User Actions

Users can:
- **Retry**: Attempt to recover from the error
- **Go Home**: Navigate to the home page
- **Report Bug**: Send error details via email

### 3. Error Reporting

Errors are automatically reported to Sentry in production with:
- Error stack trace
- User context
- Component information
- Performance metrics
- User actions leading to error

## Monitoring & Analytics

### 1. Error Tracking

- **Development**: Console logging with detailed error information
- **Production**: Sentry integration with error aggregation
- **User Context**: User ID, session information, component context

### 2. Performance Monitoring

- **API Calls**: Request duration, status codes, error rates
- **User Actions**: Button clicks, form submissions, navigation
- **Component Lifecycle**: Mount/unmount events, render performance

### 3. User Experience

- **Error Boundaries**: Prevent app crashes
- **Friendly UI**: Clear error messages and recovery options
- **Support Integration**: Error ID for support tickets

## Configuration

### 1. Development Mode

```typescript
// Console logging enabled
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### 2. Production Mode

```typescript
// Sentry integration enabled
logger.error('Error message', error, {
  component: 'MyComponent',
  action: 'api_call',
  metadata: { userId: '123' }
});
```

### 3. Custom Error Handler

```tsx
<GlobalErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
    console.log('Custom error handler:', error);
    // Send to custom analytics
    analytics.track('error', { error: error.message });
  }}
>
  <App />
</GlobalErrorBoundary>
```

## Testing

### 1. Error Boundary Testing

```typescript
// Test error boundary
import { render, screen } from '@testing-library/react';
import GlobalErrorBoundary from '../src/components/GlobalErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('error boundary catches errors', () => {
  render(
    <GlobalErrorBoundary>
      <ThrowError />
    </GlobalErrorBoundary>
  );
  
  expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
});
```

### 2. Logger Testing

```typescript
// Mock logger for testing
jest.mock('../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
```

## Best Practices

### 1. Error Boundary Placement

- **App Root**: Catch all unhandled errors
- **Route Level**: Catch route-specific errors
- **Component Level**: Catch component-specific errors

### 2. Logging Guidelines

- **Use appropriate log levels**: debug, info, warn, error
- **Include context**: component, action, user information
- **Avoid sensitive data**: passwords, tokens, personal information
- **Use structured logging**: consistent format and metadata

### 3. Error Recovery

- **Provide retry options**: for transient errors
- **Graceful degradation**: show partial content when possible
- **User feedback**: clear error messages and next steps

### 4. Performance

- **Minimal logging in production**: avoid performance impact
- **Async error reporting**: don't block user interactions
- **Error aggregation**: group similar errors together

## Troubleshooting

### 1. Common Issues

- **Sentry not working**: Check DSN configuration
- **Console logs not showing**: Check NODE_ENV setting
- **Error boundary not catching**: Check component hierarchy

### 2. Debug Mode

```typescript
// Enable debug mode
process.env.NODE_ENV = 'development';
logger.debug('Debug message');
```

### 3. Error Investigation

- **Error ID**: Use for support tickets
- **Sentry Dashboard**: View error details and trends
- **Console Logs**: Check browser console for details

## Future Enhancements

- **Real-time error monitoring**: WebSocket integration
- **Error analytics**: Error frequency and impact analysis
- **Automated error recovery**: Self-healing mechanisms
- **User feedback integration**: In-app error reporting
- **Performance budgets**: Automatic performance alerts
