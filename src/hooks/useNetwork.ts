/**
 * React hook for network connectivity state
 */

import { useEffect, useCallback } from 'react';
import { useNetworkStore, useIsOnline, useIsConnecting, useRetryCount, useNetworkStatus } from '../store/networkStore';
import { networkFetch, networkGet, networkPost, networkPut, networkDelete, type FetchOptions } from '../lib/network';

/**
 * Hook to get network connectivity state
 */
export function useNetwork() {
  const networkStatus = useNetworkStatus();

  return {
    ...networkStatus,
  };
}

/**
 * Hook for network-aware fetch operations
 */
export function useNetworkFetch() {
  const { isOnline, isConnecting } = useNetwork();

  const fetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    if (!isOnline) {
      throw new Error('Network is offline');
    }
    return networkFetch(url, options);
  }, [isOnline]);

  const get = useCallback(async (url: string, options: Omit<FetchOptions, 'method'> = {}) => {
    if (!isOnline) {
      throw new Error('Network is offline');
    }
    return networkGet(url, options);
  }, [isOnline]);

  const post = useCallback(async (url: string, data: any, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
    if (!isOnline) {
      throw new Error('Network is offline');
    }
    return networkPost(url, data, options);
  }, [isOnline]);

  const put = useCallback(async (url: string, data: any, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
    if (!isOnline) {
      throw new Error('Network is offline');
    }
    return networkPut(url, data, options);
  }, [isOnline]);

  const del = useCallback(async (url: string, options: Omit<FetchOptions, 'method'> = {}) => {
    if (!isOnline) {
      throw new Error('Network is offline');
    }
    return networkDelete(url, options);
  }, [isOnline]);

  return {
    fetch,
    get,
    post,
    put,
    delete: del,
    isOnline,
    isConnecting,
  };
}

/**
 * Hook for handling network state changes with callbacks
 */
export function useNetworkEffect(
  onOnline?: () => void,
  onOffline?: () => void,
  onConnectingChange?: (connecting: boolean) => void
) {
  const { isOnline, isConnecting } = useNetwork();

  useEffect(() => {
    if (isOnline && onOnline) {
      onOnline();
    }
  }, [isOnline, onOnline]);

  useEffect(() => {
    if (!isOnline && onOffline) {
      onOffline();
    }
  }, [isOnline, onOffline]);

  useEffect(() => {
    if (onConnectingChange) {
      onConnectingChange(isConnecting);
    }
  }, [isConnecting, onConnectingChange]);
}

/**
 * Hook for retry logic with exponential backoff
 */
export function useRetryableOperation<T>(
  operation: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    enabled?: boolean;
  } = {}
) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, enabled = true } = options;
  const { isOnline } = useNetwork();

  const executeWithRetry = useCallback(async (): Promise<T> => {
    if (!enabled || !isOnline) {
      throw new Error('Operation not enabled or network offline');
    }

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1),
          maxDelay
        );

        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }, [operation, isOnline, enabled, maxRetries, baseDelay, maxDelay, ...dependencies]);

  return executeWithRetry;
}
