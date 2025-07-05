import { Middleware } from '@reduxjs/toolkit';
import { rendererLogger } from '../logging/rendererLogger';
import { LogCategory } from '../../shared/logging/types';

/**
 * Redux middleware for logging actions and state changes
 */
export const loggingMiddleware: Middleware = (store) => (next) => (action) => {
  const startTime = Date.now();
  
  // Log the action being dispatched
  rendererLogger.debug(
    `Redux action: ${action.type}`,
    LogCategory.TECHNICAL,
    { component: 'Redux' },
    {
      type: action.type,
      payload: action.payload,
      meta: action.meta
    }
  );

  // Execute the action
  const result = next(action);
  
  const duration = Date.now() - startTime;
  
  // Log performance if action took longer than threshold
  if (duration > 100) { // 100ms threshold
    rendererLogger.warn(
      `Slow Redux action: ${action.type}`,
      LogCategory.PERFORMANCE,
      { component: 'Redux' },
      {
        type: action.type,
        duration
      }
    );
  }

  // Log specific action types of interest
  if (action.type.includes('error') || action.type.includes('rejected')) {
    rendererLogger.error(
      `Redux error action: ${action.type}`,
      LogCategory.TECHNICAL,
      { component: 'Redux' },
      {
        type: action.type,
        payload: action.payload,
        error: action.error
      }
    );
  }

  return result;
};