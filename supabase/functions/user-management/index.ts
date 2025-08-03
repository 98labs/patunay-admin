import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserRequestBody {
  action: 'create' | 'update' | 'disable' | 'enable' | 'delete' | 'list' | 'get'
  userId?: string
  data?: {
    email?: string
    password?: string
    first_name?: string
    last_name?: string
    role?: string
    phone?: string
    avatar_url?: string
    is_active?: boolean
    permissions?: string[]
  }
  filters?: {
    role?: string
    is_active?: boolean
    search?: string
  }
  pagination?: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
}

async function verifyAdminAccess(supabaseAdmin: SupabaseClient, token: string) {
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  
  if (userError || !user) {
    throw new Error('Invalid authentication')
  }

  // Check if user has admin or super_user role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.log('Profile not found for user:', user.id)
    // Create a default profile if not exists
    await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        role: 'admin', // Default to admin for testing
        is_active: true,
        created_at: new Date().toISOString()
      })
    return user
  }

  if (profile.role !== 'admin' && profile.role !== 'super_user') {
    throw new Error(`Insufficient permissions. Admin access required. Current role: ${profile.role}`)
  }

  return user
}

async function createUser(supabaseAdmin: SupabaseClient, data: UserRequestBody['data']) {
  if (!data?.email || !data?.password) {
    throw new Error('Email and password are required')
  }

  // Generate a UUID for the user
  const userId = crypto.randomUUID()

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    id: userId,
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      first_name: data.first_name,
      last_name: data.last_name
    }
  })

  if (authError) {
    throw authError
  }

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role || 'staff',
      phone: data.phone,
      avatar_url: data.avatar_url,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (profileError) {
    // Rollback auth user creation
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw profileError
  }

  // Add permissions if provided
  if (data.permissions && data.permissions.length > 0) {
    const permissionInserts = data.permissions.map(permission => ({
      user_id: userId,
      permission: permission,
      granted_by: userId, // Will be updated with actual admin ID
      created_at: new Date().toISOString()
    }))

    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .insert(permissionInserts)

    if (permError) {
      console.error('Failed to add permissions:', permError)
    }
  }

  return { 
    id: userId,
    email: data.email,
    ...authData.user 
  }
}

async function updateUser(supabaseAdmin: SupabaseClient, userId: string, data: UserRequestBody['data']) {
  const updateData: any = {}
  
  if (data?.first_name !== undefined) updateData.first_name = data.first_name
  if (data?.last_name !== undefined) updateData.last_name = data.last_name
  if (data?.role !== undefined) updateData.role = data.role
  if (data?.phone !== undefined) updateData.phone = data.phone
  if (data?.avatar_url !== undefined) updateData.avatar_url = data.avatar_url
  if (data?.is_active !== undefined) updateData.is_active = data.is_active
  
  updateData.updated_at = new Date().toISOString()

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  // Update auth metadata if email needs updating
  if (data?.email) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: data.email }
    )
    if (authError) {
      console.error('Failed to update auth email:', authError)
    }
  }

  // Handle permissions update
  if (data?.permissions !== undefined) {
    // Remove existing permissions
    await supabaseAdmin
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)

    // Add new permissions
    if (data.permissions.length > 0) {
      const permissionInserts = data.permissions.map(permission => ({
        user_id: userId,
        permission: permission,
        granted_by: userId, // Will be updated with actual admin ID
        created_at: new Date().toISOString()
      }))

      await supabaseAdmin
        .from('user_permissions')
        .insert(permissionInserts)
    }
  }

  return profile
}

async function disableUser(supabaseAdmin: SupabaseClient, userId: string) {
  // Update profile to inactive
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (profileError) {
    throw profileError
  }

  // Ban the user in auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { ban_duration: '876000h' } // 100 years
  )

  if (authError) {
    console.error('Failed to ban user:', authError)
  }

  return { success: true, message: 'User disabled successfully' }
}

async function enableUser(supabaseAdmin: SupabaseClient, userId: string) {
  // Update profile to active
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (profileError) {
    throw profileError
  }

  // Unban the user in auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { ban_duration: 'none' }
  )

  if (authError) {
    console.error('Failed to unban user:', authError)
  }

  return { success: true, message: 'User enabled successfully' }
}

async function deleteUser(supabaseAdmin: SupabaseClient, userId: string) {
  // Delete from auth (this will cascade delete the profile due to foreign key)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  
  if (error) {
    throw error
  }

  return { success: true, message: 'User deleted successfully' }
}

async function listUsers(supabaseAdmin: SupabaseClient, filters?: UserRequestBody['filters'], pagination?: UserRequestBody['pagination']) {
  const page = pagination?.page || 1
  const pageSize = pagination?.pageSize || 10
  const sortBy = pagination?.sortBy || 'created_at'
  const sortOrder = pagination?.sortOrder || 'desc'
  
  // For email search, we need to get all users first and then filter
  const needsEmailSearch = filters?.search?.includes('@') || false
  
  let query = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })

  // Apply filters
  if (filters?.role) {
    query = query.eq('role', filters.role)
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }
  
  // Apply name search (not email)
  if (filters?.search && !needsEmailSearch) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`)
  }

  // Get all data if we need to search by email
  if (!needsEmailSearch) {
    // Apply sorting and pagination normally
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1)
  } else {
    // Get all records for email filtering
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  // Get auth data for emails
  const userIds = data?.map(p => p.id) || []
  const authUsers = await Promise.all(
    userIds.map(async (id) => {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(id)
        return user
      } catch (error) {
        return null
      }
    })
  )

  const authUsersMap = new Map(authUsers.filter(u => u).map(u => [u!.id, u]))

  // Get permissions for each user
  let usersWithPermissions = await Promise.all(
    (data || []).map(async (profile) => {
      const { data: permissions } = await supabaseAdmin
        .from('user_permissions')
        .select('permission')
        .eq('user_id', profile.id)
      
      const authUser = authUsersMap.get(profile.id)
      return {
        ...profile,
        email: authUser?.email || '',
        email_confirmed_at: authUser?.email_confirmed_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        permissions: permissions?.map(p => p.permission) || []
      }
    })
  )

  // Filter by email if needed
  if (needsEmailSearch && filters?.search) {
    usersWithPermissions = usersWithPermissions.filter(user => 
      user.email.toLowerCase().includes(filters.search!.toLowerCase())
    )
  }

  // Apply manual pagination if we did email search
  let paginatedData = usersWithPermissions
  let totalCount = usersWithPermissions.length
  
  if (needsEmailSearch) {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    paginatedData = usersWithPermissions.slice(start, end)
  } else {
    totalCount = count || 0
  }

  return {
    data: paginatedData,
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  }
}

async function getUser(supabaseAdmin: SupabaseClient, userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw profileError
  }

  // Get permissions
  const { data: permissions } = await supabaseAdmin
    .from('user_permissions')
    .select('permission')
    .eq('user_id', userId)

  // Get auth data
  let authUser = null
  try {
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    authUser = user
  } catch (error) {
    console.error('Failed to get auth user:', error)
  }

  return {
    ...profile,
    email: authUser?.email || '',
    email_confirmed_at: authUser?.email_confirmed_at,
    last_sign_in_at: authUser?.last_sign_in_at,
    permissions: permissions?.map(p => p.permission) || []
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
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

    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify admin access
    const adminUser = await verifyAdminAccess(supabaseAdmin, token)

    // Parse request body
    const body: UserRequestBody = await req.json()

    let result: any

    switch (body.action) {
      case 'create':
        result = await createUser(supabaseAdmin, body.data)
        break
      
      case 'update':
        if (!body.userId) throw new Error('User ID required')
        result = await updateUser(supabaseAdmin, body.userId, body.data)
        break
      
      case 'disable':
        if (!body.userId) throw new Error('User ID required')
        result = await disableUser(supabaseAdmin, body.userId)
        break
      
      case 'enable':
        if (!body.userId) throw new Error('User ID required')
        result = await enableUser(supabaseAdmin, body.userId)
        break
      
      case 'delete':
        if (!body.userId) throw new Error('User ID required')
        result = await deleteUser(supabaseAdmin, body.userId)
        break
      
      case 'list':
        result = await listUsers(supabaseAdmin, body.filters, body.pagination)
        break
      
      case 'get':
        if (!body.userId) throw new Error('User ID required')
        result = await getUser(supabaseAdmin, body.userId)
        break
      
      default:
        throw new Error(`Unknown action: ${body.action}`)
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Insufficient permissions') ? 403 : 400,
      }
    )
  }
})