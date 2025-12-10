import React from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  isOffline?: boolean;
  className?: string;
}

export default function ErrorState({ 
  title = 'Something went wrong',
  message, 
  onRetry, 
  retryCount = 0,
  maxRetries = 3,
  isOffline = false,
  className = '' 
}: ErrorStateProps) {
  const canRetry = onRetry && retryCount < maxRetries;
  const Icon = isOffline ? WifiOff : AlertCircle;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">{message}</p>
      
      {isOffline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 max-w-sm">
          <div className="flex items-center">
            <WifiOff className="w-4 h-4 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">You're offline. Some features may be unavailable.</p>
          </div>
        </div>
      )}
      
      {canRetry && (
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
            {retryCount > 0 && (
              <span className="ml-2 text-xs text-red-500">({retryCount}/{maxRetries})</span>
            )}
          </button>
          {retryCount >= maxRetries && (
            <p className="text-xs text-gray-500">Maximum retries reached. Please refresh the page.</p>
          )}
        </div>
      )}
    </div>
  );
}
