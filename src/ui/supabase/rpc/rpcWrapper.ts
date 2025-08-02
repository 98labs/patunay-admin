import supabase from '../index';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NetworkError 
} from '../../utils/errorHandling';

export interface RpcOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface RpcResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Enhanced RPC wrapper with error handling, retries, and logging
 */
export async function callRpc<T = any>(
  functionName: string,
  params: Record<string, any> = {},
  options: RpcOptions = {}
): Promise<T> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new NetworkError('Request timeout', 408)), timeout);
      });

      // Create RPC promise
      const rpcPromise = supabase.rpc(functionName, params);

      // Race between RPC and timeout
      const { data, error } = await Promise.race([
        rpcPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        // Parse Supabase errors
        lastError = parseSupabaseError(error, functionName);
        
        // Don't retry auth errors
        if (lastError instanceof AuthenticationError || 
            lastError instanceof AuthorizationError) {
          throw lastError;
        }
        
        // Don't retry validation errors
        if (lastError instanceof ValidationError) {
          throw lastError;
        }
        
        // Retry network errors
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        throw lastError;
      }

      // Success - return data
      return data as T;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry certain errors
      if (error instanceof AuthenticationError || 
          error instanceof AuthorizationError ||
          error instanceof ValidationError) {
        throw error;
      }
      
      // Log retry attempts
      if (attempt < retries) {
        console.warn(`RPC ${functionName} attempt ${attempt} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  // All retries failed
  throw lastError || new AppError(`RPC ${functionName} failed after ${retries} attempts`);
}

/**
 * Parse Supabase errors into appropriate error types
 */
function parseSupabaseError(error: any, functionName: string): Error {
  const message = error.message || 'Unknown error';
  const code = error.code || 'UNKNOWN';
  
  // Authentication errors
  if (code === 'PGRST301' || message.includes('JWT')) {
    return new AuthenticationError('Authentication required');
  }
  
  // Authorization errors
  if (code === '42501' || message.includes('permission denied')) {
    return new AuthorizationError(`Access denied for ${functionName}`);
  }
  
  // Not authenticated
  if (message.includes('Not authenticated')) {
    return new AuthenticationError('Please log in to continue');
  }
  
  // Permission errors from our RPC functions
  if (message.includes('Insufficient permissions') || 
      message.includes('You can only') ||
      message.includes('Only super users')) {
    return new AuthorizationError(message);
  }
  
  // Validation errors
  if (code === '23502' || code === '23503' || code === '23514') {
    return new ValidationError(message);
  }
  
  // Foreign key violations
  if (code === '23503') {
    return new ValidationError('Referenced record does not exist');
  }
  
  // Unique violations
  if (code === '23505') {
    return new ValidationError('Record already exists');
  }
  
  // Network errors
  if (message.includes('Failed to fetch') || 
      message.includes('Network request failed')) {
    return new NetworkError('Network error. Please check your connection');
  }
  
  // Generic database error
  if (code.startsWith('P')) {
    return new AppError(message, 'DATABASE_ERROR');
  }
  
  // Default
  return new AppError(message, code);
}

/**
 * Safe RPC wrapper that returns result object instead of throwing
 */
export async function safeCallRpc<T = any>(
  functionName: string,
  params: Record<string, any> = {},
  options: RpcOptions = {}
): Promise<RpcResult<T>> {
  try {
    const data = await callRpc<T>(functionName, params, options);
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}