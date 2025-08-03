import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RoleRequestBody {
  action: 'assign' | 'revoke' | 'grant-permission' | 'revoke-permission' | 'list-permissions'
  userId: string
  role?: string
  permission?: string
}

const VALID_ROLES = ['super_user', 'admin', 'issuer', 'appraiser', 'staff', 'viewer']

const ROLE_PERMISSIONS = {
  super_user: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.assign',
    'roles.revoke',
    'permissions.grant',
    'permissions.revoke',
    'artworks.create',
    'artworks.read',
    'artworks.update',
    'artworks.delete',
    'nfc.read',
    'nfc.write',
    'system.admin'
  ],
  admin: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.assign',
    'roles.revoke',
    'permissions.grant',
    'permissions.revoke',
    'artworks.create',
    'artworks.read',
    'artworks.update',
    'artworks.delete',
    'nfc.read',
    'nfc.write'
  ],
  issuer: [
    'artworks.create',
    'artworks.read',
    'artworks.update',
    'nfc.read',
    'nfc.write'
  ],
  appraiser: [
    'artworks.read',
    'artworks.appraise',
    'nfc.read'
  ],
  staff: [
    'artworks.read',
    'nfc.read'
  ],
  viewer: [
    'artworks.read'
  ]
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
    throw new Error('User profile not found')
  }

  if (profile.role !== 'admin' && profile.role !== 'super_user') {
    throw new Error('Insufficient permissions. Admin access required.')
  }

  return { user, role: profile.role }
}

async function assignRole(supabaseAdmin: SupabaseClient, userId: string, role: string, adminId: string) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Valid roles are: ${VALID_ROLES.join(', ')}`)
  }

  // Update the user's role
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  // Clear existing permissions
  await supabaseAdmin
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)

  // Grant default permissions for the role
  const defaultPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || []
  if (defaultPermissions.length > 0) {
    const permissionInserts = defaultPermissions.map(permission => ({
      user_id: userId,
      permission,
      granted_by: adminId,
      created_at: new Date().toISOString()
    }))

    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .insert(permissionInserts)

    if (permError) {
      console.error('Failed to grant default permissions:', permError)
    }
  }

  return {
    ...profile,
    permissions: defaultPermissions
  }
}

async function revokeRole(supabaseAdmin: SupabaseClient, userId: string) {
  // Set user to default 'staff' role
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: 'staff',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  // Clear all permissions
  await supabaseAdmin
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)

  // Grant default staff permissions
  const defaultPermissions = ROLE_PERMISSIONS.staff
  const permissionInserts = defaultPermissions.map(permission => ({
    user_id: userId,
    permission,
    granted_by: userId,
    created_at: new Date().toISOString()
  }))

  await supabaseAdmin
    .from('user_permissions')
    .insert(permissionInserts)

  return {
    ...profile,
    permissions: defaultPermissions
  }
}

async function grantPermission(supabaseAdmin: SupabaseClient, userId: string, permission: string, adminId: string) {
  // Check if permission already exists
  const { data: existing } = await supabaseAdmin
    .from('user_permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('permission', permission)
    .single()

  if (existing) {
    throw new Error('Permission already granted')
  }

  // Grant the permission
  const { data, error } = await supabaseAdmin
    .from('user_permissions')
    .insert({
      user_id: userId,
      permission,
      granted_by: adminId,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function revokePermission(supabaseAdmin: SupabaseClient, userId: string, permission: string) {
  const { error } = await supabaseAdmin
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('permission', permission)

  if (error) {
    throw error
  }

  return { success: true, message: 'Permission revoked successfully' }
}

async function listPermissions(supabaseAdmin: SupabaseClient, userId: string) {
  // Get user profile with role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw profileError
  }

  // Get explicit permissions
  const { data: permissions, error: permError } = await supabaseAdmin
    .from('user_permissions')
    .select('permission, granted_by, created_at')
    .eq('user_id', userId)

  if (permError) {
    throw permError
  }

  // Get default role permissions
  const defaultPermissions = ROLE_PERMISSIONS[profile.role as keyof typeof ROLE_PERMISSIONS] || []

  return {
    role: profile.role,
    defaultPermissions,
    explicitPermissions: permissions || [],
    allPermissions: [
      ...new Set([
        ...defaultPermissions,
        ...(permissions?.map(p => p.permission) || [])
      ])
    ]
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
    const { user: adminUser, role: adminRole } = await verifyAdminAccess(supabaseAdmin, token)

    // Parse request body
    const body: RoleRequestBody = await req.json()

    if (!body.userId) {
      throw new Error('User ID is required')
    }

    let result: any

    switch (body.action) {
      case 'assign':
        if (!body.role) throw new Error('Role is required')
        // Only super_user can assign super_user role
        if (body.role === 'super_user' && adminRole !== 'super_user') {
          throw new Error('Only super users can assign super user role')
        }
        result = await assignRole(supabaseAdmin, body.userId, body.role, adminUser.id)
        break
      
      case 'revoke':
        result = await revokeRole(supabaseAdmin, body.userId)
        break
      
      case 'grant-permission':
        if (!body.permission) throw new Error('Permission is required')
        result = await grantPermission(supabaseAdmin, body.userId, body.permission, adminUser.id)
        break
      
      case 'revoke-permission':
        if (!body.permission) throw new Error('Permission is required')
        result = await revokePermission(supabaseAdmin, body.userId, body.permission)
        break
      
      case 'list-permissions':
        result = await listPermissions(supabaseAdmin, body.userId)
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