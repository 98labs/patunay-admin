/**
 * Centralized error handling utilities for consistent error management
 */

import { useDispatch } from 'react-redux';
import { showNotification } from '../components/NotificationMessage/slice';
import { NotificationStatus } from '../components/types/common';
import { useLogger } from '../hooks/useLogger';
import { LogCategory } from '../../shared/logging/types';

/**
 * Custom error classes for specific error types
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly context?: Record<string, any>;

  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR', 
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource });
    this.name = 'NotFoundError';
  }
}

export class NFCError extends AppError {
  constructor(message: string, operation?: string) {
    super(message, 'NFC_ERROR', undefined, { operation });
    this.name = 'NFCError';
  }
}

/**
 * Error handling utilities for consistent error processing
 */
export const createErrorHandler = (
  dispatch: ReturnType<typeof useDispatch>,
  logger: ReturnType<typeof useLogger>,
  component?: string
) => {
  /**
   * Handle errors with logging and user notification
   */
  const handleError = (
    error: Error | AppError,
    context?: {
      action?: string;
      silent?: boolean;
      category?: LogCategory;
      showUserNotification?: boolean;
    }
  ) => {
    const {
      action = 'unknown_action',
      silent = false,
      category = LogCategory.UI,
      showUserNotification = true
    } = context || {};

    // Log the error
    if (!silent) {
      logger.error(
        `Error in ${action}: ${error.message}`,
        category,
        error
      );
    }

    // Show user notification
    if (showUserNotification) {
      const userMessage = getUserFriendlyMessage(error);
      dispatch(showNotification({
        message: userMessage,
        status: NotificationStatus.ERROR
      }) as any);
    }

    // Return error details for component handling
    return {
      error,
      code: error instanceof AppError ? error.code : 'GENERIC_ERROR',
      message: error.message,
      userMessage: getUserFriendlyMessage(error)
    };
  };

  return { handleError };
};

/**
 * Convert technical errors to user-friendly messages
 */
export const getUserFriendlyMessage = (error: Error | AppError): string => {
  if (error instanceof ValidationError) {
    return error.message; // Validation errors are already user-friendly
  }
  
  if (error instanceof AuthenticationError) {
    return 'Please log in to continue';
  }
  
  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action';
  }
  
  if (error instanceof NotFoundError) {
    return `The requested ${error.context?.resource || 'item'} could not be found`;
  }
  
  if (error instanceof NetworkError) {
    if (error.statusCode === 500) {
      return 'Server error. Please try again later';
    }
    if (error.statusCode === 408) {
      return 'Request timeout. Please check your connection and try again';
    }
    return 'Network error. Please check your connection';
  }
  
  if (error instanceof NFCError) {
    return 'NFC operation failed. Please ensure your NFC device is connected and try again';
  }
  
  if (error instanceof AppError) {
    // Use the error message if it's already user-friendly
    return error.message;
  }
  
  // Generic fallback
  return 'An unexpected error occurred. Please try again';
};


/**
 * Retry utility for failed operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    shouldRetry = (error) => error instanceof NetworkError
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }
      
      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};

/**
 * Form validation error handling
 */
export interface FieldError {
  field: string;
  message: string;
}

export const handleValidationErrors = (
  errors: FieldError[],
  setFieldError: (field: string, message: string) => void
) => {
  errors.forEach(({ field, message }) => {
    setFieldError(field, message);
  });
};

/**
 * Error boundary helper
 */
export const createErrorInfo = (error: Error, errorInfo?: React.ErrorInfo) => ({
  message: error.message,
  stack: error.stack,
  componentStack: errorInfo?.componentStack,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
});