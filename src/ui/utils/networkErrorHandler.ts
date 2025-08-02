import { store } from '../store';
import { showNotification } from '../components/NotificationMessage/slice';
import { NotificationStatus } from '../components/types/common';
import { clearAuth } from '../store/features/auth/authSliceV2';
import supabase from '../supabase';

// Network error types
export enum NetworkErrorType {
  CONNECTION_LOST = 'CONNECTION_LOST',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT = 'RATE_LIMIT',
  MAINTENANCE = 'MAINTENANCE'
}

// Network status manager
class NetworkStatusManager {
  private isOnline: boolean = navigator.onLine;
  private retryQueue: Set<() => Promise<any>> = new Set();
  private listeners: Set<(online: boolean) => void> = new Set();
  
  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Check network status periodically
    const intervalMs = parseInt(import.meta.env.VITE_NETWORK_TEST_INTERVAL || '30000', 10);
    if (intervalMs > 0) {
      setInterval(() => this.checkNetworkStatus(), intervalMs);
    }
  }
  
  private handleOnline = () => {
    this.setOnlineStatus(true);
    this.processRetryQueue();
  };
  
  private handleOffline = () => {
    this.setOnlineStatus(false);
  };
  
  private setOnlineStatus(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(online));
      
      // Show notification
      store.dispatch(showNotification({
        message: online ? 'Connection restored' : 'Connection lost',
        status: online ? NotificationStatus.SUCCESS : NotificationStatus.WARNING
      }) as any);
    }
  }
  
  private async checkNetworkStatus() {
    try {
      // Use environment variable for connectivity test endpoint
      const testEndpoint = import.meta.env.VITE_NETWORK_TEST_ENDPOINT || 'https://www.google.com/favicon.ico';
      const corsMode = import.meta.env.VITE_NETWORK_TEST_CORS_MODE || 'no-cors';
      const useAuth = import.meta.env.VITE_NETWORK_TEST_USE_AUTH === 'true';
      
      // Build request options
      const requestOptions: RequestInit = {
        method: 'HEAD',
        mode: corsMode as RequestMode
      };
      
      // Add authentication headers if using Supabase endpoint
      if (useAuth && testEndpoint.includes(import.meta.env.VITE_SUPABASE_URL)) {
        const session = await supabase.auth.getSession();
        if (session.data.session?.access_token) {
          requestOptions.headers = {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          };
        }
      }
      
      const response = await fetch(testEndpoint, requestOptions);
      
      // Consider it online if we get any response (including 401)
      // 401 means the server is reachable but auth failed
      this.setOnlineStatus(true);
    } catch {
      // If the fetch fails completely, check navigator.onLine as fallback
      this.setOnlineStatus(navigator.onLine);
    }
  }
  
  private async processRetryQueue() {
    const queue = Array.from(this.retryQueue);
    this.retryQueue.clear();
    
    for (const retry of queue) {
      try {
        await retry();
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  }
  
  addRetry(retryFn: () => Promise<any>) {
    this.retryQueue.add(retryFn);
  }
  
  addListener(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  getStatus() {
    return this.isOnline;
  }
}

// Global instance
export const networkStatus = new NetworkStatusManager();

// Enhanced error handler for network errors
export async function handleNetworkError(
  error: any,
  context?: {
    operation?: string;
    retryable?: boolean;
    critical?: boolean;
  }
): Promise<void> {
  const { operation = 'operation', retryable = true, critical = false } = context || {};
  
  // Determine error type
  let errorType: NetworkErrorType;
  let message: string;
  
  if (!navigator.onLine || !networkStatus.getStatus()) {
    errorType = NetworkErrorType.CONNECTION_LOST;
    message = 'No internet connection. Please check your network.';
  } else if (error.status === 401 || error.message?.includes('JWT')) {
    errorType = NetworkErrorType.UNAUTHORIZED;
    message = 'Session expired. Please log in again.';
  } else if (error.status === 429) {
    errorType = NetworkErrorType.RATE_LIMIT;
    message = 'Too many requests. Please slow down.';
  } else if (error.status === 503) {
    errorType = NetworkErrorType.MAINTENANCE;
    message = 'Service is under maintenance. Please try again later.';
  } else if (error.status >= 500) {
    errorType = NetworkErrorType.SERVER_ERROR;
    message = 'Server error. Our team has been notified.';
  } else if (error.message?.includes('timeout')) {
    errorType = NetworkErrorType.TIMEOUT;
    message = `Request timeout. ${retryable ? 'Retrying...' : 'Please try again.'}`;
  } else {
    errorType = NetworkErrorType.SERVER_ERROR;
    message = `Failed to ${operation}. Please try again.`;
  }
  
  // Handle based on error type
  switch (errorType) {
    case NetworkErrorType.UNAUTHORIZED:
      // Clear auth and redirect to login
      store.dispatch(clearAuth());
      await supabase.auth.signOut();
      window.location.href = '#/login';
      break;
      
    case NetworkErrorType.CONNECTION_LOST:
      // Show persistent notification
      store.dispatch(showNotification({
        message,
        status: NotificationStatus.WARNING,
        persistent: true
      }) as any);
      break;
      
    case NetworkErrorType.RATE_LIMIT:
      // Show warning with cooldown
      store.dispatch(showNotification({
        message,
        status: NotificationStatus.WARNING,
        duration: 10000 // 10 seconds
      }) as any);
      break;
      
    default:
      // Show error notification
      store.dispatch(showNotification({
        message,
        status: critical ? NotificationStatus.ERROR : NotificationStatus.WARNING
      }) as any);
  }
  
  // Log error for debugging
  console.error(`Network error (${errorType}):`, {
    operation,
    error: error.message || error,
    status: error.status,
    url: error.url
  });
}

// Retry wrapper with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: any, attempt: number) => boolean;
    onRetry?: (error: any, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = (error) => {
      // Retry on network errors, not on client errors
      return !error.status || error.status >= 500 || error.status === 429;
    },
    onRetry
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if we're online before attempting
      if (!networkStatus.getStatus()) {
        throw new Error('No internet connection');
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;
      
      // Notify about retry
      if (onRetry) {
        onRetry(error, attempt);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

// React hook for network status
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(networkStatus.getStatus());
  
  useEffect(() => {
    const unsubscribe = networkStatus.addListener(setIsOnline);
    return unsubscribe;
  }, []);
  
  return isOnline;
}

// Interceptor for Supabase client
export function setupSupabaseInterceptor() {
  // Unfortunately, Supabase client doesn't support global interceptors
  // We'll need to wrap individual calls or use the RPC wrapper
}