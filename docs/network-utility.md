# Network Utility Documentation

## Overview

The network utility provides comprehensive offline/online detection, retry logic with exponential backoff, and toast notifications for network failures. It's built with Zustand for state management and integrates seamlessly with React components.

## Features

- ✅ **Offline/Online Detection** via `navigator.onLine` and event listeners
- ✅ **Zustand Store** for global network state management
- ✅ **Retry Logic** with exponential backoff for idempotent requests
- ✅ **Toast Notifications** for POST/PUT/DELETE failures
- ✅ **Network-Aware Fetch** wrapper with automatic retry
- ✅ **React Hooks** for easy component integration
- ✅ **TypeScript Support** with full type safety

## Architecture

```
src/lib/network.ts          # Core network detection and fetch logic
src/store/networkStore.ts   # Zustand store for network state
src/hooks/useNetwork.ts     # React hooks for network functionality
src/lib/networkFetch.ts     # Enhanced fetch with toast integration
components/NetworkStatus.tsx # UI components for network status
components/ui/OfflineBar.tsx # Updated offline bar component
```

## Usage Examples

### 1. Basic Network State

```typescript
import { useNetwork } from '../src/hooks/useNetwork';

function MyComponent() {
  const { isOnline, isConnecting, retryCount } = useNetwork();
  
  return (
    <div>
      <p>Online: {isOnline ? 'Yes' : 'No'}</p>
      <p>Connecting: {isConnecting ? 'Yes' : 'No'}</p>
      <p>Retry Count: {retryCount}</p>
    </div>
  );
}
```

### 2. Network-Aware Fetch

```typescript
import { useNetworkFetch } from '../src/hooks/useNetwork';

function DataComponent() {
  const { get, post, put, delete: del } = useNetworkFetch();
  
  const fetchData = async () => {
    try {
      // GET requests automatically retry with exponential backoff
      const response = await get('/api/data');
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Network error:', error);
    }
  };
  
  const createData = async (newData: any) => {
    try {
      // POST requests show toast notifications on failure
      const response = await post('/api/data', newData);
      const result = await response.json();
      console.log('Created:', result);
    } catch (error) {
      console.error('Create failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={() => createData({ name: 'Test' })}>Create Data</button>
    </div>
  );
}
```

### 3. Retryable Operations

```typescript
import { useRetryableOperation } from '../src/hooks/useNetwork';

function RetryableComponent() {
  const retryableOperation = useRetryableOperation(
    async () => {
      const response = await fetch('/api/important-data');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    [], // dependencies
    { maxRetries: 5, baseDelay: 1000, maxDelay: 10000 }
  );
  
  const handleOperation = async () => {
    try {
      const result = await retryableOperation();
      console.log('Success:', result);
    } catch (error) {
      console.error('Operation failed after retries:', error);
    }
  };
  
  return <button onClick={handleOperation}>Execute Operation</button>;
}
```

### 4. Network Status Components

```typescript
import { NetworkStatus, NetworkIndicator } from '../components/NetworkStatus';

function App() {
  return (
    <div>
      {/* Detailed network status */}
      <NetworkStatus showDetails={true} />
      
      {/* Compact indicator */}
      <NetworkIndicator />
    </div>
  );
}
```

## API Reference

### Core Functions

#### `getNetworkState(): NetworkState`
Returns current network state.

#### `subscribeToNetworkState(listener: () => void): () => void`
Subscribe to network state changes. Returns unsubscribe function.

#### `networkFetch(url: string, options: FetchOptions): Promise<Response>`
Enhanced fetch with retry logic and network awareness.

#### `networkGet(url: string, options?: FetchOptions): Promise<Response>`
GET request with automatic retry.

#### `networkPost(url: string, data: any, options?: FetchOptions): Promise<Response>`
POST request with error handling.

#### `networkPut(url: string, data: any, options?: FetchOptions): Promise<Response>`
PUT request with error handling.

#### `networkDelete(url: string, options?: FetchOptions): Promise<Response>`
DELETE request with error handling.

### React Hooks

#### `useNetwork()`
Returns network state and status.

#### `useNetworkFetch()`
Returns network-aware fetch functions.

#### `useNetworkEffect(onOnline?, onOffline?, onConnectingChange?)`
Handle network state changes with callbacks.

#### `useRetryableOperation(operation, dependencies, options)`
Create retryable operations with exponential backoff.

### Zustand Store

#### `useNetworkStore`
Direct access to network store.

#### `useIsOnline()`
Hook for online status only.

#### `useIsConnecting()`
Hook for connecting status only.

#### `useRetryCount()`
Hook for retry count only.

#### `useNetworkStatus()`
Hook for complete network status.

## Configuration

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries?: number;        // Default: 3
  baseDelay?: number;         // Default: 1000ms
  maxDelay?: number;          // Default: 10000ms
  backoffMultiplier?: number; // Default: 2
  retryCondition?: (error: any) => boolean; // Default: isRetryableError
}
```

### Fetch Options

```typescript
interface FetchOptions extends RequestInit {
  retry?: RetryConfig;
  showToastOnError?: boolean; // Default: true for POST/PUT/DELETE
  idempotent?: boolean;       // Default: false
}
```

## Error Handling

### Retryable Errors
- Network errors (TypeError with 'fetch' in message)
- 5xx server errors
- 408 (Timeout) and 429 (Rate Limit) errors

### Non-Retryable Errors
- 4xx client errors (except 408, 429)
- Authentication errors
- Validation errors

## Toast Notifications

POST, PUT, and DELETE requests automatically show toast notifications on failure when `showToastOnError` is true (default).

## Integration Points

### 1. App Layout
The `OfflineBar` component is already integrated into the app layout and uses the network store.

### 2. Existing Components
Update existing fetch calls to use network-aware functions:

```typescript
// Before
const response = await fetch('/api/data');

// After
import { useNetworkFetch } from '../src/hooks/useNetwork';
const { get } = useNetworkFetch();
const response = await get('/api/data');
```

### 3. Error Boundaries
Network errors are handled gracefully with retry logic and user feedback.

## Testing

### Unit Tests
Test individual functions with mocked network conditions.

### Integration Tests
Test network state changes and retry logic.

### E2E Tests
Test offline/online scenarios and user experience.

## Performance Considerations

- Network state is cached and only updates when necessary
- Retry logic uses exponential backoff to prevent overwhelming servers
- Toast notifications are debounced to prevent spam
- Event listeners are properly cleaned up

## Browser Compatibility

- Modern browsers with `navigator.onLine` support
- Fetch API support
- Promise support
- Event listener support

## Future Enhancements

- WebSocket connection monitoring
- Network quality detection
- Offline data synchronization
- Background sync support
- Network-aware caching strategies
