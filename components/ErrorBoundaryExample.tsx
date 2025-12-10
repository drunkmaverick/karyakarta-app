/**
 * Example component demonstrating error boundary and logger usage
 */

'use client';

import React, { useState } from 'react';
import GlobalErrorBoundary, { useErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { useLogger } from '../src/lib/logger';
import Button from './ui/Button';
import { AlertCircle, Bug, Info } from 'lucide-react';

// Component that can throw errors for testing
function ErrorProneComponent({ shouldThrow }: { shouldThrow: boolean }) {
  const logger = useLogger('ErrorProneComponent');

  if (shouldThrow) {
    logger.error('Intentional error thrown for testing', new Error('Test error'));
    throw new Error('This is a test error for demonstration purposes');
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-800">✅ Component rendered successfully!</p>
    </div>
  );
}

// Component using error boundary hook
function ComponentWithErrorHook() {
  const { captureError, resetError } = useErrorBoundary();
  const logger = useLogger('ComponentWithErrorHook');

  const handleThrowError = () => {
    const error = new Error('Error thrown via useErrorBoundary hook');
    logger.error('Manual error trigger', error);
    captureError(error);
  };

  const handleAsyncError = async () => {
    try {
      // Simulate async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async operation failed'));
        }, 1000);
      });
    } catch (error) {
      logger.error('Async error caught', error as Error);
      captureError(error as Error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Error Boundary Hook Example</h3>
      <div className="flex space-x-3">
        <Button onClick={handleThrowError} variant="danger">
          <Bug className="h-4 w-4 mr-2" />
          Throw Error
        </Button>
        <Button onClick={handleAsyncError} variant="warning">
          <AlertCircle className="h-4 w-4 mr-2" />
          Async Error
        </Button>
        <Button onClick={resetError} variant="secondary">
          Reset Error
        </Button>
      </div>
    </div>
  );
}

// Main example component
export default function ErrorBoundaryExample() {
  const [shouldThrow, setShouldThrow] = useState(false);
  const logger = useLogger('ErrorBoundaryExample');

  const handleToggleError = () => {
    setShouldThrow(!shouldThrow);
    logger.userAction('toggle_error', { shouldThrow: !shouldThrow });
  };

  const handleLogTest = () => {
    logger.info('Test log message', { test: true });
    logger.warn('Test warning message', { test: true });
    logger.error('Test error message', new Error('Test error'), { test: true });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Error Boundary & Logger Examples</h1>
        
        {/* Logger Examples */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Logger Examples
          </h2>
          <div className="space-y-4">
            <Button onClick={handleLogTest} variant="primary">
              Test Logger Functions
            </Button>
            <div className="text-sm text-gray-600">
              <p>Check the browser console to see logged messages.</p>
              <p>In production, errors will be sent to Sentry (if configured).</p>
            </div>
          </div>
        </div>

        {/* Error Boundary Examples */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            Error Boundary Examples
          </h2>
          
          {/* Basic Error Boundary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Error Boundary</h3>
            <div className="space-y-3">
              <Button onClick={handleToggleError} variant={shouldThrow ? 'danger' : 'success'}>
                {shouldThrow ? 'Stop Throwing Errors' : 'Start Throwing Errors'}
              </Button>
              
              <GlobalErrorBoundary>
                <ErrorProneComponent shouldThrow={shouldThrow} />
              </GlobalErrorBoundary>
            </div>
          </div>

          {/* Error Boundary Hook */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Error Boundary Hook</h3>
            <GlobalErrorBoundary>
              <ComponentWithErrorHook />
            </GlobalErrorBoundary>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logger with API calls */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">API Error Logging</h3>
              <p className="text-sm text-blue-700 mb-3">
                API calls automatically log errors and performance metrics.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/nonexistent');
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                  } catch (error) {
                    logger.error('Network error occurred', error as Error, { url: '/api/nonexistent', method: 'GET' });
                  }
                }}
                variant="primary"
                size="sm"
              >
                Test API Error
              </Button>
            </div>

            {/* Performance logging */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Performance Logging</h3>
              <p className="text-sm text-green-700 mb-3">
                Log performance metrics for operations.
              </p>
              <Button
                onClick={() => {
                  const start = performance.now();
                  // Simulate some work
                  setTimeout(() => {
                    const duration = performance.now() - start;
                    logger.performance('Simulated operation', duration, { 
                      operation: 'test',
                      success: true 
                    });
                  }, 1000);
                }}
                variant="success"
                size="sm"
              >
                Test Performance Log
              </Button>
            </div>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Sentry DSN:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configured' : 'Not configured'}</p>
            <p><strong>Error Reporting:</strong> {process.env.NODE_ENV === 'production' ? 'Sentry' : 'Console only'}</p>
            <p><strong>Debug Mode:</strong> {process.env.NODE_ENV === 'development' ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
