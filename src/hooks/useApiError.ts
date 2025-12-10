import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface ApiError {
  message?: string;
  error?: string;
  status?: number;
}

export function useApiError() {
  const handleError = useCallback((error: any, context?: string) => {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
    
    let message = 'An unexpected error occurred';
    
    if (error?.message) {
      message = error.message;
    } else if (error?.error) {
      message = error.error;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    // Show appropriate toast based on error type
    if (error?.status === 401) {
      toast.error('Please log in to continue');
    } else if (error?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error?.status === 404) {
      toast.error('The requested resource was not found');
    } else if (error?.status === 429) {
      toast.error('Too many requests. Please try again later');
    } else if (error?.status >= 500) {
      toast.error('Server error. Please try again later');
    } else {
      toast.error(message);
    }
  }, []);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const handleInfo = useCallback((message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleInfo
  };
}













