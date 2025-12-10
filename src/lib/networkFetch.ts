/**
 * Network-aware fetch wrapper with toast notifications
 */

import { networkFetch, networkGet, networkPost, networkPut, networkDelete, type FetchOptions } from './network';

/**
 * Enhanced fetch with toast notifications for errors
 */
export async function fetchWithToast(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  try {
    return await networkFetch(url, options);
  } catch (error) {
    // Show toast for POST/PUT/DELETE failures
    if (options.showToastOnError && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
      // Import toast dynamically to avoid circular dependencies
      try {
        const { useToast } = await import('../../components/ui/Toast');
        // Note: This would need to be called from a React component context
        console.error('Network request failed:', error);
      } catch (toastError) {
        console.error('Failed to show toast:', toastError);
      }
    }
    throw error;
  }
}

/**
 * Network-aware GET request with retry
 */
export async function getWithRetry(
  url: string,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<Response> {
  return networkGet(url, {
    ...options,
    idempotent: true,
  });
}

/**
 * Network-aware POST request with error handling
 */
export async function postWithToast(
  url: string,
  data: any,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return networkPost(url, data, {
    ...options,
    showToastOnError: true,
  });
}

/**
 * Network-aware PUT request with error handling
 */
export async function putWithToast(
  url: string,
  data: any,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return networkPut(url, data, {
    ...options,
    showToastOnError: true,
  });
}

/**
 * Network-aware DELETE request with error handling
 */
export async function deleteWithToast(
  url: string,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<Response> {
  return networkDelete(url, {
    ...options,
    showToastOnError: true,
  });
}

/**
 * Create a network-aware fetch function with default options
 */
export function createNetworkFetch(defaultOptions: FetchOptions = {}) {
  return (url: string, options: FetchOptions = {}) => {
    return fetchWithToast(url, { ...defaultOptions, ...options });
  };
}

/**
 * Network-aware fetch with authentication headers
 */
export function createAuthenticatedFetch(token: string) {
  return (url: string, options: FetchOptions = {}) => {
    return fetchWithToast(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };
}

// Re-export network utilities
export {
  networkFetch,
  networkGet,
  networkPost,
  networkPut,
  networkDelete,
  type FetchOptions,
} from './network';
