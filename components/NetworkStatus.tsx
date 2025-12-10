/**
 * Network status component that shows connectivity information
 */

'use client';

import React from 'react';
import { useNetwork } from '../src/hooks/useNetwork';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

interface NetworkStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function NetworkStatus({ showDetails = false, className = '' }: NetworkStatusProps) {
  const { isOnline, isConnecting, retryCount, lastOnlineTime, lastOfflineTime } = useNetwork();

  if (isOnline && !isConnecting) {
    return null; // Don't show anything when online and not connecting
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {isConnecting ? (
          <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
        ) : !isOnline ? (
          <WifiOff className="h-5 w-5 text-red-600" />
        ) : (
          <Wifi className="h-5 w-5 text-green-600" />
        )}
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {isConnecting ? 'Connecting...' : !isOnline ? 'You\'re offline' : 'Network Status'}
          </h3>
          
          {!isOnline && (
            <p className="text-sm text-gray-600 mt-1">
              Some features may be unavailable. Check your internet connection.
            </p>
          )}
          
          {isConnecting && (
            <p className="text-sm text-gray-600 mt-1">
              Attempting to reconnect... {retryCount > 0 && `(Attempt ${retryCount})`}
            </p>
          )}
          
          {showDetails && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div>Last online: {formatTime(lastOnlineTime)}</div>
              <div>Last offline: {formatTime(lastOfflineTime)}</div>
              {retryCount > 0 && <div>Retry attempts: {retryCount}</div>}
            </div>
          )}
        </div>
        
        {!isOnline && (
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact network status indicator
 */
export function NetworkIndicator({ className = '' }: { className?: string }) {
  const { isOnline, isConnecting } = useNetwork();

  if (isOnline && !isConnecting) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isConnecting ? (
        <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-600" />
      )}
      <span className="text-sm text-gray-600">
        {isConnecting ? 'Connecting...' : 'Offline'}
      </span>
    </div>
  );
}

/**
 * Network error component for showing specific network errors
 */
export function NetworkError({ 
  error, 
  onRetry, 
  className = '' 
}: { 
  error: Error; 
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Network Error</h3>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
