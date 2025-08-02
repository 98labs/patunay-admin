# Edge Function Setup for Secure User Management

Since we've removed the service role key from the client code, we need to set up Supabase Edge Functions to handle privileged operations like creating auth users.

## 1. Create Edge Function for User Creation

Create a new edge function called `create-user`:

```bash
supabase functions new create-user
```

## 2. Edge Function Code

Create the following file at `supabase/functions/create-user/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get request body
    const { email, password, userId, metadata } = await req.json()

    if (!email || !password || !userId) {
      throw new Error('Missing required fields: email, password, userId')
    }

    // Create the auth user with the specified ID
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      id: userId,
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: metadata || {}
    })

    if (authError) {
      throw authError
    }

    return new Response(
      JSON.stringify({ user: authData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

## 3. Deploy the Edge Function

```bash
supabase functions deploy create-user
```

## 4. Update Environment Variables

Make sure your Supabase project has the following environment variables set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 5. Usage in the Application

The application will call this edge function when creating users through the RPC function, ensuring the service role key is never exposed to the client.