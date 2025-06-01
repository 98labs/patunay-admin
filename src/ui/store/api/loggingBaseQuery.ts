import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { rendererLogger } from '../../logging/rendererLogger';
import { LogCategory } from '../../../shared/logging/types';

/**
 * Enhanced base query with request/response logging
 */
export const createLoggingBaseQuery = (baseUrl: string) => {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Add any auth headers here
      return headers;
    },
  });

  return async (args: any, api: any, extraOptions: any) => {
    const startTime = Date.now();
    
    // Log the API request
    const url = typeof args === 'string' ? args : args.url;
    const method = typeof args === 'string' ? 'GET' : (args.method || 'GET');
    
    rendererLogger.apiCall(method, url, {
      args: typeof args === 'object' ? { ...args, body: '[REDACTED]' } : args,
      endpoint: api.endpoint
    });

    try {
      const result = await baseQuery(args, api, extraOptions);
      const duration = Date.now() - startTime;
      
      if (result.error) {
        rendererLogger.apiResponse(
          method,
          url,
          result.error.status as number || 500,
          {
            error: result.error,
            endpoint: api.endpoint
          },
          duration
        );
      } else {
        rendererLogger.apiResponse(
          method,
          url,
          200,
          {
            dataSize: result.data ? JSON.stringify(result.data).length : 0,
            endpoint: api.endpoint
          },
          duration
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      rendererLogger.error(
        `API request failed: ${method} ${url}`,
        LogCategory.API,
        { component: 'RTKQuery' },
        {
          method,
          url,
          endpoint: api.endpoint,
          duration
        },
        error as Error
      );

      throw error;
    }
  };
};