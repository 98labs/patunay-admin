import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import supabase from '../../supabase';

// Custom base query that uses Supabase client
const supabaseBaseQuery = fetchBaseQuery({
  baseUrl: '/', // Not used since we're using Supabase client directly
  prepareHeaders: (headers, { getState }) => {
    // Get auth token from state if needed
    const state = getState() as RootState;
    const token = state.auth?.session?.access_token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Enhanced base query that integrates with Supabase
const enhancedBaseQuery = async (args: any, api: any, extraOptions: any) => {
  // For Supabase operations, we'll handle them directly
  if (args.supabaseOperation) {
    try {
      const result = await args.supabaseOperation();
      return { data: result };
    } catch (error) {
      return {
        error: {
          status: 'CUSTOM_ERROR',
          data: error instanceof Error ? error.message : 'Unknown error',
          error: error
        }
      };
    }
  }
  
  // For regular HTTP requests, use the standard base query
  return supabaseBaseQuery(args, api, extraOptions);
};

// Create the main API slice
export const api = createApi({
  reducerPath: 'api',
  baseQuery: enhancedBaseQuery,
  tagTypes: [
    'Artwork',
    'Artist', 
    'User',
    'Appraisal',
    'Collection',
    'Statistics',
    'NfcTag',
    'Asset'
  ],
  endpoints: () => ({}), // Endpoints will be injected by other slices
});

// Export hooks for usage in functional components
// export const {} = api;

// Export types
export type ApiState = ReturnType<typeof api.reducer>;