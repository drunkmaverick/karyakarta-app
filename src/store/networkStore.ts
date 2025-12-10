/**
 * Zustand store for network connectivity state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getNetworkState, subscribeToNetworkState, type NetworkState } from '../lib/network';

interface NetworkStore extends NetworkState {
  // Actions
  setOnline: (online: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  updateFromNetworkManager: () => void;
}

export const useNetworkStore = create<NetworkStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnecting: false,
    lastOnlineTime: null,
    lastOfflineTime: null,
    retryCount: 0,
    maxRetries: 3,

    // Actions
    setOnline: (online: boolean) => {
      set((state) => ({
        isOnline: online,
        lastOnlineTime: online ? new Date() : state.lastOnlineTime,
        lastOfflineTime: !online ? new Date() : state.lastOfflineTime,
        retryCount: online ? 0 : state.retryCount, // Reset retry count when coming online
      }));
    },

    setConnecting: (connecting: boolean) => {
      set({ isConnecting: connecting });
    },

    incrementRetryCount: () => {
      set((state) => ({ retryCount: state.retryCount + 1 }));
    },

    resetRetryCount: () => {
      set({ retryCount: 0 });
    },

    updateFromNetworkManager: () => {
      const networkState = getNetworkState();
      set(networkState);
    },
  }))
);

// Subscribe to network manager changes
if (typeof window !== 'undefined') {
  subscribeToNetworkState(() => {
    useNetworkStore.getState().updateFromNetworkManager();
  });
}

// Export selectors for common use cases
export const useIsOnline = () => useNetworkStore((state) => state.isOnline);
export const useIsConnecting = () => useNetworkStore((state) => state.isConnecting);
export const useRetryCount = () => useNetworkStore((state) => state.retryCount);
export const useNetworkStatus = () => useNetworkStore((state) => ({
  isOnline: state.isOnline,
  isConnecting: state.isConnecting,
  lastOnlineTime: state.lastOnlineTime,
  lastOfflineTime: state.lastOfflineTime,
  retryCount: state.retryCount,
}));

// Export the store for direct access if needed
export { useNetworkStore as networkStore };
