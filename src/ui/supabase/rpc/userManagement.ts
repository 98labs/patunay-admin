import supabase from '../index';
import { callRpc, safeCallRpc } from './rpcWrapper';

interface CreateUserWithProfileParams {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string;
  avatar_url?: string;
  organization_id?: string;
  permissions?: string[];
}

interface UpdateUserProfileParams {
  user_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  phone?: string;
  avatar_url?: string;
}

interface GetOrganizationUsersParams {
  organization_id?: string;
  search?: string;
  role?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Create a new user with profile using secure RPC function
 * This function requires admin or super_user role
 */
export async function createUserWithProfile(params: CreateUserWithProfileParams) {
  return safeCallRpc('create_user_with_profile', {
    p_email: params.email,
    p_password: params.password,
    p_first_name: params.first_name,
    p_last_name: params.last_name,
    p_role: params.role,
    p_phone: params.phone,
    p_avatar_url: params.avatar_url,
    p_organization_id: params.organization_id,
    p_permissions: params.permissions
  }, {
    retries: 1 // Don't retry user creation
  });
}

/**
 * Update user profile using secure RPC function
 * This function requires appropriate permissions based on the fields being updated
 */
export async function updateUserProfile(params: UpdateUserProfileParams) {
  return safeCallRpc('update_user_profile', {
    p_user_id: params.user_id,
    p_first_name: params.first_name,
    p_last_name: params.last_name,
    p_role: params.role,
    p_is_active: params.is_active,
    p_phone: params.phone,
    p_avatar_url: params.avatar_url
  });
}

/**
 * Soft delete a user using secure RPC function
 * This function requires admin or super_user role
 */
export async function softDeleteUser(userId: string) {
  return safeCallRpc('soft_delete_user', {
    p_user_id: userId
  });
}

/**
 * Get organization users with filtering using secure RPC function
 * This function returns users based on the caller's permissions
 */
export async function getOrganizationUsers(params: GetOrganizationUsersParams = {}) {
  return safeCallRpc('get_organization_users', {
    p_organization_id: params.organization_id,
    p_search: params.search,
    p_role: params.role,
    p_is_active: params.is_active,
    p_limit: params.limit || 50,
    p_offset: params.offset || 0
  });
}