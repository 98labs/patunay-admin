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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;