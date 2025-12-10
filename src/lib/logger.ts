/**
 * Logger system with console logging in dev and Sentry integration in production
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: Date;
  error?: Error;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private sentryAvailable: boolean = false;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Check if Sentry is available
    this.checkSentryAvailability();
  }

  private async checkSentryAvailability() {
    try {
      // Dynamic import to avoid bundling Sentry in development
      if (this.isProduction) {
        const { captureException, captureMessage, addBreadcrumb } = await import('@sentry/nextjs');
        this.sentryAvailable = true;
      }
    } catch (error) {
      console.warn('Sentry not available:', error);
      this.sentryAvailable = false;
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    const errorStr = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`;
  }

  private async logToSentry(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.sentryAvailable || !this.isProduction) return;

    try {
      const { captureException, captureMessage, addBreadcrumb } = await import('@sentry/nextjs');
      
      // Add breadcrumb for all log levels
      addBreadcrumb({
        message,
        level: level as any,
        category: context?.component || 'logger',
        data: context?.metadata,
        timestamp: Date.now() / 1000,
      });

      if (error) {
        // Add context to error
        if (context) {
          error.name = `${error.name} [${context.component || 'unknown'}]`;
        }
        captureException(error, {
          tags: {
            component: context?.component,
            action: context?.action,
          },
          user: {
            id: context?.userId,
          },
          extra: context?.metadata,
        });
      } else {
        captureMessage(message, level as any);
      }
    } catch (sentryError) {
      console.error('Failed to log to Sentry:', sentryError);
    }
  }

  private logToConsole(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.isDevelopment) return;

    const formattedMessage = this.formatMessage(level, message, context, error);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  private async log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    // Always log to console in development
    this.logToConsole(level, message, context, error);
    
    // Log to Sentry in production
    await this.logToSentry(level, message, context, error);
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  // Convenience methods for common use cases
  logUserAction(action: string, component: string, metadata?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      component,
      action,
      metadata,
    });
  }

  logApiCall(method: string, url: string, status?: number, duration?: number) {
    this.info(`API ${method} ${url}`, {
      component: 'api',
      action: 'api_call',
      metadata: {
        method,
        url,
        status,
        duration,
      },
    });
  }

  logError(error: Error, component: string, context?: string) {
    this.error(`Error in ${component}${context ? `: ${context}` : ''}`, error, {
      component,
      action: 'error',
      metadata: {
        errorName: error.name,
        errorMessage: error.message,
        context,
      },
    });
  }

  logNetworkError(error: Error, url: string, method: string) {
    this.error(`Network error: ${method} ${url}`, error, {
      component: 'network',
      action: 'network_error',
      metadata: {
        url,
        method,
        errorName: error.name,
      },
    });
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      component: 'performance',
      action: 'timing',
      metadata: {
        operation,
        duration,
        ...metadata,
      },
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context),
  userAction: (action: string, component: string, metadata?: Record<string, any>) => 
    logger.logUserAction(action, component, metadata),
  apiCall: (method: string, url: string, status?: number, duration?: number) => 
    logger.logApiCall(method, url, status, duration),
  networkError: (error: Error, url: string, method: string) => 
    logger.logNetworkError(error, url, method),
  performance: (operation: string, duration: number, metadata?: Record<string, any>) => 
    logger.logPerformance(operation, duration, metadata),
};

// React hook for logging
export function useLogger(component: string) {
  return {
    debug: (message: string, metadata?: Record<string, any>) => 
      logger.debug(message, { component, metadata }),
    info: (message: string, metadata?: Record<string, any>) => 
      logger.info(message, { component, metadata }),
    warn: (message: string, metadata?: Record<string, any>) => 
      logger.warn(message, { component, metadata }),
    error: (message: string, error?: Error, metadata?: Record<string, any>) => 
      logger.error(message, error, { component, metadata }),
    userAction: (action: string, metadata?: Record<string, any>) => 
      logger.logUserAction(action, component, metadata),
    apiCall: (method: string, url: string, status?: number, duration?: number) => 
      logger.logApiCall(method, url, status, duration),
    performance: (operation: string, duration: number, metadata?: Record<string, any>) => 
      logger.logPerformance(operation, duration, metadata),
  };
}
