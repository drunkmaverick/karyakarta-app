/**
 * Global Error Boundary with friendly fallback UI and error reporting
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    logger.error('Global Error Boundary caught an error', error, {
      component: 'GlobalErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      logger.info('User attempted to retry after error', {
        component: 'GlobalErrorBoundary',
        action: 'retry',
        metadata: {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount + 1,
        },
      });

      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleGoHome = () => {
    logger.info('User navigated to home after error', {
      component: 'GlobalErrorBoundary',
      action: 'go_home',
      metadata: {
        errorId: this.state.errorId,
      },
    });

    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorId } = this.state;
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Create mailto link with error details
    const subject = `Bug Report - Error ID: ${errorId}`;
    const body = `Please describe what you were doing when this error occurred:\n\n\n\nError Details:\n${JSON.stringify(errorDetails, null, 2)}`;
    const mailtoLink = `mailto:support@karyakarta.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    logger.info('User reported bug via email', {
      component: 'GlobalErrorBoundary',
      action: 'report_bug',
      metadata: {
        errorId,
        errorMessage: error?.message,
      },
    });

    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified and we're working to fix it.
            </p>

            {/* Error ID for support */}
            {errorId && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Error ID:</strong> <code className="font-mono text-xs">{errorId}</code>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Please include this ID when contacting support
                </p>
              </div>
            )}

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-left mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </button>

              <button
                onClick={this.handleReportBug}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Report this Issue
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-sm text-gray-500">
              <p>
                If this problem persists, please contact our support team at{' '}
                <a
                  href="mailto:support@karyakarta.com"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  support@karyakarta.com
                </a>
              </p>
            </div>

            {/* Retry Count Warning */}
            {retryCount >= this.maxRetries && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Maximum retry attempts reached. Please try refreshing the page or contact support.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for error boundary context (if needed)
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    logger.error('Error captured by useErrorBoundary hook', error, {
      component: 'useErrorBoundary',
      action: 'capture_error',
    });
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}
