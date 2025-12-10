import { useState, useCallback } from 'react';
import { useToast } from '../../components/ui/Toast';

export interface UIState {
  loading: boolean;
  error: string | null;
  retryCount: number;
  isOffline: boolean;
}

export interface UIStateActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsOffline: (offline: boolean) => void;
  retry: () => void;
  reset: () => void;
  showErrorToast: (message: string, title?: string) => void;
  showSuccessToast: (message: string, title?: string) => void;
}

const MAX_RETRIES = 3;

export function useUIState(initialState: Partial<UIState> = {}): UIState & UIStateActions {
  const [loading, setLoading] = useState(initialState.loading ?? false);
  const [error, setError] = useState<string | null>(initialState.error ?? null);
  const [retryCount, setRetryCount] = useState(initialState.retryCount ?? 0);
  const [isOffline, setIsOffline] = useState(initialState.isOffline ?? false);
  
  const { showToast } = useToast();

  const retry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      setError(null);
    }
  }, [retryCount]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setRetryCount(0);
    setIsOffline(false);
  }, []);

  const showErrorToast = useCallback((message: string, title = 'Error') => {
    showToast({
      type: 'error',
      title,
      message,
    });
  }, [showToast]);

  const showSuccessToast = useCallback((message: string, title = 'Success') => {
    showToast({
      type: 'success',
      title,
      message,
    });
  }, [showToast]);

  return {
    loading,
    error,
    retryCount,
    isOffline,
    setLoading,
    setError,
    setIsOffline,
    retry,
    reset,
    showErrorToast,
    showSuccessToast,
  };
}
