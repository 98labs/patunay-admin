import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"]
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"]

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`)
}

// Create singleton instance to avoid multiple client warnings
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Default client for regular operations
if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
      debug: false
    },
    // Add global options
    global: {
      headers: {
        'X-Client-Info': 'patunay-admin'
      }
    }
  });
  
}

const supabase = supabaseInstance;

// WARNING: Admin operations should be performed through Edge Functions or RPC calls
// Never expose service role key in client-side code
export const supabaseAdmin = null; // Deprecated - use server-side functions instead

export default supabase;