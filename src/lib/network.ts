/**
 * Network utility for detecting online/offline status and handling network requests
 */

export interface NetworkState {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
  retryCount: number;
  maxRetries: number;
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

export interface FetchOptions extends RequestInit {
  retry?: RetryConfig;
  showToastOnError?: boolean;
  idempotent?: boolean;
}

class NetworkManager {
  private listeners: Set<() => void> = new Set();
  private state: NetworkState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnecting: false,
    lastOnlineTime: null,
    lastOfflineTime: null,
    retryCount: 0,
    maxRetries: 3,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.setState({
      isOnline: true,
      isConnecting: false,
      lastOnlineTime: new Date(),
      retryCount: 0,
    });
  }

  private handleOffline() {
    this.setState({
      isOnline: false,
      isConnecting: false,
      lastOfflineTime: new Date(),
    });
  }

  private setState(newState: Partial<NetworkState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  public getState(): NetworkState {
    return { ...this.state };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public setConnecting(connecting: boolean) {
    this.setState({ isConnecting: connecting });
  }

  public incrementRetryCount() {
    this.setState({ retryCount: this.state.retryCount + 1 });
  }

  public resetRetryCount() {
    this.setState({ retryCount: 0 });
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    this.listeners.clear();
  }
}

// Global network manager instance
const networkManager = new NetworkManager();

/**
 * Get current network state
 */
export function getNetworkState(): NetworkState {
  return networkManager.getState();
}

/**
 * Subscribe to network state changes
 */
export function subscribeToNetworkState(listener: () => void): () => void {
  return networkManager.subscribe(listener);
}

/**
 * Set connecting state
 */
export function setConnecting(connecting: boolean) {
  networkManager.setConnecting(connecting);
}

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 10000,
  backoffMultiplier: number = 2
): number {
  const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors, timeouts, and 5xx server errors are retryable
  if (!error) return false;
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true; // Network error
  }
  
  if (error.status >= 500 && error.status < 600) {
    return true; // Server error
  }
  
  if (error.status === 408 || error.status === 429) {
    return true; // Timeout or rate limit
  }
  
  return false;
}

/**
 * Enhanced fetch with retry, backoff, and network awareness
 */
export async function networkFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retry = {},
    showToastOnError = true,
    idempotent = false,
    ...fetchOptions
  } = options;

  const retryConfig: Required<RetryConfig> = {
    maxRetries: retry.maxRetries ?? 3,
    baseDelay: retry.baseDelay ?? 1000,
    maxDelay: retry.maxDelay ?? 10000,
    backoffMultiplier: retry.backoffMultiplier ?? 2,
    retryCondition: retry.retryCondition ?? isRetryableError,
  };

  // Check if we're offline
  if (!getNetworkState().isOnline) {
    throw new Error('Network is offline');
  }

  // Only retry GET requests or explicitly marked idempotent requests
  const shouldRetry = idempotent || fetchOptions.method === 'GET' || !fetchOptions.method;

  let lastError: any;

  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      setConnecting(true);
      
      const response = await fetch(url, fetchOptions);
      
      // Reset retry count on success
      networkManager.resetRetryCount();
      setConnecting(false);
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt or retry not allowed
      if (attempt === retryConfig.maxRetries || !shouldRetry) {
        break;
      }
      
      // Check if error is retryable
      if (!retryConfig.retryCondition(error)) {
        break;
      }
      
      // Calculate delay and wait
      const delay = calculateRetryDelay(
        attempt,
        retryConfig.baseDelay,
        retryConfig.maxDelay,
        retryConfig.backoffMultiplier
      );
      
      console.warn(`Network request failed (attempt ${attempt}/${retryConfig.maxRetries}), retrying in ${delay}ms:`, error);
      
      networkManager.incrementRetryCount();
      await sleep(delay);
    }
  }

  setConnecting(false);
  
  // Show toast for POST/PUT/DELETE failures if enabled
  if (showToastOnError && (fetchOptions.method === 'POST' || fetchOptions.method === 'PUT' || fetchOptions.method === 'DELETE')) {
    // Import toast dynamically to avoid circular dependencies
    const { useToast } = await import('../../components/ui/Toast');
    // Note: This would need to be called from a React component context
    console.error('Network request failed:', lastError);
  }
  
  throw lastError;
}

/**
 * Convenience function for GET requests with retry
 */
export async function networkGet(url: string, options: Omit<FetchOptions, 'method'> = {}): Promise<Response> {
  return networkFetch(url, {
    ...options,
    method: 'GET',
    idempotent: true,
  });
}

/**
 * Convenience function for POST requests
 */
export async function networkPost(url: string, data: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<Response> {
  return networkFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    showToastOnError: true,
  });
}

/**
 * Convenience function for PUT requests
 */
export async function networkPut(url: string, data: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<Response> {
  return networkFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    showToastOnError: true,
  });
}

/**
 * Convenience function for DELETE requests
 */
export async function networkDelete(url: string, options: Omit<FetchOptions, 'method'> = {}): Promise<Response> {
  return networkFetch(url, {
    ...options,
    method: 'DELETE',
    showToastOnError: true,
  });
}

/**
 * Check if the app is currently online
 */
export function isOnline(): boolean {
  return getNetworkState().isOnline;
}

/**
 * Check if the app is currently connecting
 */
export function isConnecting(): boolean {
  return getNetworkState().isConnecting;
}

/**
 * Get network status summary
 */
export function getNetworkStatus(): {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
  retryCount: number;
} {
  const state = getNetworkState();
  return {
    isOnline: state.isOnline,
    isConnecting: state.isConnecting,
    lastOnlineTime: state.lastOnlineTime,
    lastOfflineTime: state.lastOfflineTime,
    retryCount: state.retryCount,
  };
}
