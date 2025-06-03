import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"]
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"]
const supabaseServiceRoleKey = import.meta.env["VITE_SUPABASE_SERVICE_ROLE_KEY"]

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

// Create singleton instances to avoid multiple client warnings
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

// Default client for regular operations
if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}
const supabase = supabaseInstance;

// Admin client for service role operations (user management, etc.)
if (supabaseServiceRoleKey && !supabaseAdminInstance) {
  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}
export const supabaseAdmin = supabaseAdminInstance;

export default supabase;