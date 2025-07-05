import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { rendererLogger } from '../logging/rendererLogger';
import { LogCategory } from '../../shared/logging/types';
import { selectUser } from '../store/features/auth';

/**
 * React hook for structured logging in UI components
 */
export const useLogger = (component?: string) => {
  const user = useSelector(selectUser);

  // Create context with user information
  const createContext = useCallback((additionalContext = {}) => ({
    component,
    userId: user?.id,
    ...additionalContext
  }), [user?.id, component]);

  // Convenience methods with component context
  const error = useCallback((message: string, category: LogCategory = LogCategory.UI, data?: any, error?: Error) => {
    rendererLogger.error(message, category, createContext(), data, error);
  }, [createContext]);

  const warn = useCallback((message: string, category: LogCategory = LogCategory.UI, data?: any) => {
    rendererLogger.warn(message, category, createContext(), data);
  }, [createContext]);

  const info = useCallback((message: string, category: LogCategory = LogCategory.UI, data?: any) => {
    rendererLogger.info(message, category, createContext(), data);
  }, [createContext]);

  const debug = useCallback((message: string, category: LogCategory = LogCategory.UI, data?: any) => {
    rendererLogger.debug(message, category, createContext(), data);
  }, [createContext]);

  // Specialized logging methods
  const logUserAction = useCallback((action: string, data?: any) => {
    rendererLogger.userAction(action, createContext({ action }), data);
  }, [createContext]);

  const logApiCall = useCallback((method: string, endpoint: string, data?: any) => {
    rendererLogger.apiCall(method, endpoint, createContext(), data);
  }, [createContext]);

  const logApiResponse = useCallback((method: string, endpoint: string, status: number, data?: any, duration?: number) => {
    rendererLogger.apiResponse(method, endpoint, status, createContext(), data, duration);
  }, [createContext]);

  const logNavigation = useCallback((from: string, to: string) => {
    rendererLogger.navigation(from, to, createContext());
  }, [createContext]);

  const logFormSubmit = useCallback((formName: string, data?: any) => {
    rendererLogger.formSubmit(formName, createContext(), data);
  }, [createContext]);

  const logComponentError = useCallback((error: Error, errorInfo?: any) => {
    rendererLogger.componentError(component || 'Unknown', error, errorInfo);
  }, [component]);

  const createTimer = useCallback((label: string) => {
    return rendererLogger.timer(label, createContext());
  }, [createContext]);

  return {
    // Basic logging
    error,
    warn,
    info,
    debug,
    
    // Specialized logging
    logUserAction,
    logApiCall,
    logApiResponse,
    logNavigation,
    logFormSubmit,
    logComponentError,
    createTimer,
    
    // Direct access to logger for advanced usage
    logger: rendererLogger
  };
};