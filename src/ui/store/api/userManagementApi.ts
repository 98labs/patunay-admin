import { api } from './baseApi';
import supabase, { supabaseAdmin } from '../../supabase';

// Types for user management
export type UserRole = 'super_user' | 'admin' | 'issuer' | 'appraiser' | 'staff' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  email_confirmed_at?: string;
  permissions?: string[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  phone?: string;
  permissions?: string[];
  avatar_file?: File;
}

export interface UpdateUserRequest {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
  phone?: string;
  avatar_url?: string;
  avatar_file?: File;
}

export interface UserListResponse {
  data: UserProfile[];
  count: number;
  error?: string;
}

export interface UserResponse {
  data: UserProfile | null;
  error?: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_activity_at: string;
}

export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
}

export interface UserListRequest {
  page?: number;
  pageSize?: number;
  filters?: UserFilters;
  sortBy?: 'created_at' | 'first_name' | 'last_name' | 'email' | 'last_login_at';
  sortOrder?: 'asc' | 'desc';
}

// Inject user management endpoints
export const userManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users with roles and permissions
    getUsers: builder.query<UserListResponse, UserListRequest>({
      query: ({ page = 1, pageSize = 10, filters = {}, sortBy = 'created_at', sortOrder = 'desc' }) => ({
        supabaseOperation: async () => {
          console.log('[UserManagementAPI] Starting getUsers query', { page, pageSize, sortBy, sortOrder });
          
          try {
            // Check if we have proper access
            const { data: currentUser, error: authError } = await supabase.auth.getUser();
            console.log('[UserManagementAPI] Auth check result:', { 
              hasUser: !!currentUser?.user, 
              userId: currentUser?.user?.id,
              authError 
            });
            if (!currentUser?.user) {
              throw new Error('Not authenticated');
            }
            
            // For user management, we need either service role or admin privileges
            const client = supabaseAdmin || supabase;
            console.log('[UserManagementAPI] Using client:', supabaseAdmin ? 'supabaseAdmin' : 'supabase');
            
            // Fetch profiles
            let profilesData = null;
            let profilesError = null;
            let count = 0;
            
            try {
              // First try with the full query
              console.log('[UserManagementAPI] Attempting full query with pagination...');
              const result = await client
                .from('profiles')
                .select('*', { count: 'exact' })
                .order(sortBy, { ascending: sortOrder === 'asc' })
                .range((page - 1) * pageSize, page * pageSize - 1);
              
              profilesData = result.data;
              profilesError = result.error;
              count = result.count || 0;
              
              console.log('[UserManagementAPI] Query result:', {
                status: result.status,
                hasData: !!profilesData,
                dataLength: profilesData?.length,
                hasError: !!profilesError,
                errorCode: profilesError?.code,
                errorMessage: profilesError?.message
              });
              
              // If we get a 500 error, try a simpler query
              if (result.status === 500 || (profilesError && profilesError.message?.includes('500'))) {
                console.warn('[UserManagementAPI] Got 500 error, trying simpler query...');
                
                // Try without count and pagination
                const simpleResult = await client
                  .from('profiles')
                  .select('*')
                  .limit(pageSize);
                
                console.log('[UserManagementAPI] Simple query result:', {
                  hasData: !!simpleResult.data,
                  dataLength: simpleResult.data?.length,
                  hasError: !!simpleResult.error
                });
                
                if (!simpleResult.error) {
                  profilesData = simpleResult.data;
                  profilesError = null;
                  count = simpleResult.data?.length || 0;
                }
              }
            } catch (error) {
              console.error('[UserManagementAPI] Error querying profiles:', error);
              profilesError = error;
            }

            if (profilesError) {
              console.error('[UserManagementAPI] Profiles query error details:', {
                code: profilesError.code,
                message: profilesError.message,
                details: profilesError.details,
                hint: profilesError.hint
              });
              
              // Check for common error codes
              if (profilesError.code === 'PGRST116') {
                throw new Error('No profiles found. The profiles table might be empty.');
              } else if (profilesError.code === '42501' || profilesError.message?.includes('permission denied')) {
                throw new Error('Access denied. You need administrator privileges to view user profiles.');
              } else if (profilesError.code === '42P01') {
                throw new Error('The profiles table does not exist. Please contact your database administrator.');
              }
              
              throw new Error(`Failed to fetch users: ${profilesError.message || 'Unknown error'}`);
            }

            // Get auth users if service role is available
            let authUsersMap = new Map();
            if (supabaseAdmin) {
              try {
                const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
                authUsersMap = new Map(
                  authData?.users?.map(user => [user.id, user]) || []
                );
              } catch (error) {
                console.warn('Could not fetch auth users:', error);
              }
            }

            // If no profiles data, try to at least show current user
            if (!profilesData || profilesData.length === 0) {
              console.warn('No profiles data available, showing current user only');
              
              // Create a minimal profile for the current user
              const minimalProfile = {
                id: currentUser.user.id,
                email: currentUser.user.email || '',
                first_name: '',
                last_name: '',
                role: 'admin' as UserRole, // Assume admin if they can access this page
                is_active: true,
                phone: null,
                avatar_url: null,
                created_at: currentUser.user.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login_at: currentUser.user.last_sign_in_at,
                email_confirmed_at: currentUser.user.email_confirmed_at,
                permissions: [],
              };
              
              return {
                data: [minimalProfile],
                count: 1,
              };
            }

            // Combine profiles with auth data
            const combinedUsers = profilesData?.map(profile => {
              const authUser = authUsersMap.get(profile.id);
              return {
                id: profile.id,
                email: authUser?.email || profile.email || currentUser.user?.email || '',
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                role: profile.role || 'staff',
                is_active: profile.is_active ?? true,
                phone: profile.phone,
                avatar_url: profile.avatar_url,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                last_login_at: profile.last_login_at || authUser?.last_sign_in_at,
                email_confirmed_at: authUser?.email_confirmed_at,
                permissions: profile.permissions || [],
              };
            }) || [];

            // Apply filters
            let filteredUsers = combinedUsers;
            if (filters.role) {
              filteredUsers = filteredUsers.filter(user => user.role === filters.role);
            }
            if (filters.is_active !== undefined) {
              filteredUsers = filteredUsers.filter(user => user.is_active === filters.is_active);
            }
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              filteredUsers = filteredUsers.filter(user => 
                user.email?.toLowerCase().includes(searchLower) ||
                user.first_name?.toLowerCase().includes(searchLower) ||
                user.last_name?.toLowerCase().includes(searchLower)
              );
            }

            return {
              data: filteredUsers,
              count: count || filteredUsers.length,
            };
          } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
          }
        }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // Get single user by ID
    getUser: builder.query<UserResponse, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          try {
            // Get the profile data
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (profileError) throw profileError;

            // Get the auth user data for email
            let authUser = null;
            if (supabaseAdmin) {
              try {
                const { data, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
                if (authError) {
                  console.error('Error fetching auth user:', authError);
                } else {
                  authUser = data;
                }
              } catch (error) {
                console.error('Failed to fetch auth user:', error);
              }
            }

            // Combine the data
            const userData = {
              id: profile.id,
              email: authUser?.user?.email || '',
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              role: profile.role || 'staff',
              is_active: profile.is_active ?? true,
              phone: profile.phone,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at || authUser?.user?.created_at,
              updated_at: profile.updated_at,
              last_login_at: profile.last_login_at || authUser?.user?.last_sign_in_at,
              email_confirmed_at: authUser?.user?.email_confirmed_at,
              permissions: profile.permissions || [],
            };
            
            return { data: userData };
          } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
          }
        }
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Create new user (admin only)
    createUser: builder.mutation<UserResponse, CreateUserRequest>({
      query: (userData) => ({
        supabaseOperation: async () => {
          try {
            if (!supabaseAdmin) {
              throw new Error('Service role key not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.');
            }

            // First, try to create user with minimal data
            let authData;
            let authError;
            
            try {
              // Try with full metadata
              const result = await supabaseAdmin.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true,
                user_metadata: {
                  first_name: userData.first_name,
                  last_name: userData.last_name,
                }
              });
              authData = result.data;
              authError = result.error;
            } catch (error) {
              console.warn('Full create failed, trying minimal:', error);
              
              // Try with minimal data if full create fails
              try {
                const minimalResult = await supabaseAdmin.auth.admin.createUser({
                  email: userData.email,
                  password: userData.password,
                  email_confirm: true
                });
                authData = minimalResult.data;
                authError = minimalResult.error;
              } catch (minimalError) {
                authError = minimalError;
              }
            }

            if (authError) {
              console.error('Auth error:', authError);
              throw new Error(`Failed to create user: ${authError.message}`);
            }
            if (!authData.user) throw new Error('Failed to create user - no user data returned');

            // Upload avatar if provided
            let avatarUrl = null;
            if (userData.avatar_file) {
              try {
                const fileExt = userData.avatar_file.name.split('.').pop();
                const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('user-avatars')
                  .upload(filePath, userData.avatar_file, {
                    cacheControl: '3600',
                    upsert: true
                  });

                if (uploadError) {
                  console.error('Error uploading avatar:', uploadError);
                } else {
                  const { data } = supabase.storage
                    .from('user-avatars')
                    .getPublicUrl(filePath);
                  avatarUrl = data.publicUrl;
                }
              } catch (avatarError) {
                console.error('Avatar upload failed, continuing without avatar:', avatarError);
              }
            }

            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if profile was created by trigger
            const { data: existingProfile, error: checkError } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('id', authData.user.id)
              .single();
            
            if (checkError && checkError.code === 'PGRST116') {
              // Profile doesn't exist, create it manually
              console.warn('Profile not created by trigger, creating manually...');
              
              const { error: insertError } = await supabaseAdmin
                .from('profiles')
                .insert({
                  id: authData.user.id,
                  first_name: userData.first_name,
                  last_name: userData.last_name,
                  role: userData.role || 'staff',
                  phone: userData.phone,
                  avatar_url: avatarUrl,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  created_by: (await supabase.auth.getUser()).data.user?.id,
                });
              
              if (insertError) {
                console.error('Profile insert error:', insertError);
                // Try to clean up the auth user
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(console.error);
                throw new Error(`Failed to create user profile: ${insertError.message}`);
              }
            } else {
              // Profile exists, update it
              const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                  first_name: userData.first_name,
                  last_name: userData.last_name,
                  role: userData.role || 'staff',
                  phone: userData.phone,
                  avatar_url: avatarUrl,
                  created_by: (await supabase.auth.getUser()).data.user?.id,
                })
                .eq('id', authData.user.id);

              if (profileError) {
                console.error('Profile update error:', profileError);
                throw new Error(`Failed to update user profile: ${profileError.message}`);
              }
            }

            // Grant permissions if specified
            if (userData.permissions && userData.permissions.length > 0) {
              const currentUser = (await supabase.auth.getUser()).data.user;
              if (currentUser) {
                for (const permission of userData.permissions) {
                  // Use regular client for RPC calls as they should work with user context
                  await supabase.rpc('grant_user_permission', {
                    target_user_id: authData.user.id,
                    permission_name: permission,
                    granted_by_user_id: currentUser.id,
                  });
                }
              }
            }

            // Get the created user data by combining profile and auth data
            const { data: profile, error: fetchError } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (fetchError) throw fetchError;

            // Combine with auth data
            const createdUser = {
              id: authData.user.id,
              email: authData.user.email || '',
              first_name: profile?.first_name || userData.first_name || '',
              last_name: profile?.last_name || userData.last_name || '',
              role: profile?.role || userData.role || 'staff',
              is_active: profile?.is_active ?? true,
              phone: profile?.phone || userData.phone,
              avatar_url: profile?.avatar_url,
              created_at: profile?.created_at || authData.user.created_at,
              updated_at: profile?.updated_at,
              last_login_at: profile?.last_login_at,
              email_confirmed_at: authData.user.email_confirmed_at,
              permissions: profile?.permissions || [],
            };

            return { data: createdUser };
          } catch (error) {
            console.error('Error creating user:', error);
            throw error;
          }
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // Update user
    updateUser: builder.mutation<UserResponse, UpdateUserRequest>({
      query: (updateData) => ({
        supabaseOperation: async () => {
          try {
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('Not authenticated');

            // For admin operations (role/status changes), ensure we have service role
            const needsServiceRole = updateData.role !== undefined || updateData.is_active !== undefined;
            if (needsServiceRole && !supabaseAdmin) {
              throw new Error('Service role key not configured. Cannot perform admin operations.');
            }

            // Upload new avatar if provided
            let avatarUrl = updateData.avatar_url;
            if (updateData.avatar_file) {
              try {
                const fileExt = updateData.avatar_file.name.split('.').pop();
                const fileName = `${updateData.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('user-avatars')
                  .upload(filePath, updateData.avatar_file, {
                    cacheControl: '3600',
                    upsert: true
                  });

                if (uploadError) {
                  console.error('Error uploading avatar:', uploadError);
                  throw uploadError;
                } else {
                  const { data } = supabase.storage
                    .from('user-avatars')
                    .getPublicUrl(filePath);
                  avatarUrl = data.publicUrl;
                }
              } catch (avatarError) {
                console.error('Avatar upload failed:', avatarError);
                throw new Error('Failed to upload avatar');
              }
            }

            // Prepare profile update data (only include fields that are actually being updated)
            const profileUpdateData: Record<string, unknown> = {
              updated_by: currentUser.id,
              updated_at: new Date().toISOString(),
            };

            // Only include fields that are provided and not undefined
            if (updateData.first_name !== undefined) profileUpdateData.first_name = updateData.first_name;
            if (updateData.last_name !== undefined) profileUpdateData.last_name = updateData.last_name;
            if (updateData.phone !== undefined) profileUpdateData.phone = updateData.phone;
            if (avatarUrl !== undefined) profileUpdateData.avatar_url = avatarUrl;
            if (updateData.role !== undefined) profileUpdateData.role = updateData.role;
            if (updateData.is_active !== undefined) profileUpdateData.is_active = updateData.is_active;

            // Use service role client for admin operations, regular client otherwise
            const clientToUse = needsServiceRole ? supabaseAdmin : supabase;

            if (import.meta.env.MODE === 'development') {
              console.log('Updating user with data:', profileUpdateData);
              console.log('Using client:', needsServiceRole ? 'supabaseAdmin' : 'supabase');
            }

            // Update profile fields
            const { data: updateResult, error: updateError } = await clientToUse!
              .from('profiles')
              .update(profileUpdateData)
              .eq('id', updateData.id)
              .select();

            if (import.meta.env.MODE === 'development') {
              console.log('Update result:', updateResult);
              console.log('Update error:', updateError);
            }

            if (updateError) {
              console.error('Profile update error:', updateError);
              throw updateError;
            }

            // Get updated user data by combining profile and auth data
            const { data: profile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', updateData.id)
              .single();

            if (fetchError) throw fetchError;

            // Get auth user data for email
            let authUser = null;
            if (supabaseAdmin) {
              try {
                const { data, error: authError } = await supabaseAdmin.auth.admin.getUserById(updateData.id);
                if (authError) {
                  console.error('Error fetching auth user after update:', authError);
                } else {
                  authUser = data;
                }
              } catch (error) {
                console.error('Failed to fetch auth user after update:', error);
              }
            }

            // Combine the data
            const updatedUser = {
              id: profile.id,
              email: authUser?.user?.email || '',
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              role: profile.role || 'staff',
              is_active: profile.is_active ?? true,
              phone: profile.phone,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at || authUser?.user?.created_at,
              updated_at: profile.updated_at,
              last_login_at: profile.last_login_at || authUser?.user?.last_sign_in_at,
              email_confirmed_at: authUser?.user?.email_confirmed_at,
              permissions: profile.permissions || [],
            };

            return { data: updatedUser };
          } catch (error) {
            console.error('Error updating user:', error);
            throw error;
          }
        }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Delete user (admin only)
    deleteUser: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          try {
            if (!supabaseAdmin) {
              throw new Error('Service role key not configured. Cannot delete users without admin privileges.');
            }

            if (import.meta.env.MODE === 'development') {
              console.log('Starting user deletion process for userId:', userId);
            }

            // First, get user's profile data including avatar URL
            const { data: profile, error: profileFetchError } = await supabaseAdmin
              .from('profiles')
              .select('avatar_url, first_name, last_name')
              .eq('id', userId)
              .single();

            if (profileFetchError && profileFetchError.code !== 'PGRST116') {
              console.error('Error fetching user profile:', profileFetchError);
              // Continue with deletion even if profile fetch fails
            }

            if (import.meta.env.MODE === 'development') {
              console.log('User profile data:', profile);
            }

            // Clean up related data first to avoid foreign key constraints
            
            // 1. Delete user permissions
            try {
              const { error: permissionsError } = await supabaseAdmin
                .from('user_permissions')
                .delete()
                .eq('user_id', userId);
              
              if (permissionsError) {
                console.warn('Error deleting user permissions:', permissionsError);
              }
            } catch (permError) {
              console.warn('User permissions cleanup failed:', permError);
            }

            // 2. Delete user sessions  
            try {
              const { error: sessionsError } = await supabaseAdmin
                .from('user_sessions')
                .delete()
                .eq('user_id', userId);
              
              if (sessionsError) {
                console.warn('Error deleting user sessions:', sessionsError);
              }
            } catch (sessError) {
              console.warn('User sessions cleanup failed:', sessError);
            }

            // 3. Delete avatar from storage if it exists
            if (profile?.avatar_url) {
              try {
                // Extract the file path from the URL more reliably
                const urlParts = profile.avatar_url.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const filePath = `avatars/${fileName}`;
                
                if (import.meta.env.MODE === 'development') {
                  console.log('Deleting avatar file:', filePath);
                }
                
                const { error: storageError } = await supabase.storage
                  .from('user-avatars')
                  .remove([filePath]);
                
                if (storageError) {
                  console.warn('Error deleting avatar from storage:', storageError);
                }
              } catch (storageError) {
                console.warn('Avatar cleanup failed:', storageError);
              }
            }

            // 4. Delete the profile record manually first
            try {
              const { error: profileDeleteError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', userId);
              
              if (profileDeleteError) {
                console.warn('Error deleting profile manually:', profileDeleteError);
              }
            } catch (profileError) {
              console.warn('Manual profile deletion failed:', profileError);
            }

            // 5. Finally, delete user from Supabase Auth
            if (import.meta.env.MODE === 'development') {
              console.log('Deleting user from auth...');
            }
            
            try {
              const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
              
              if (authError) {
                console.error('Auth user deletion error:', authError);
                
                // Check if it's a foreign key constraint error
                if (authError.message?.includes('foreign key') || authError.message?.includes('violates')) {
                  throw new Error('Cannot delete user due to database constraints. Please ensure all related data is removed first.');
                } else if (authError.message?.includes('Database error')) {
                  throw new Error('Database error: The user might have related data that needs to be removed first. Please run the fix-user-deletion.sql script.');
                }
                
                throw new Error(`Failed to delete user: ${authError.message}`);
              }
            } catch (deleteError) {
              // If the user was already deleted from auth but profile remains, try to clean up
              if (deleteError instanceof Error && deleteError.message.includes('User not found')) {
                console.warn('User already deleted from auth, cleaning up profile...');
                
                // Try to delete the profile record directly
                const { error: profileCleanupError } = await supabaseAdmin
                  .from('profiles')
                  .delete()
                  .eq('id', userId);
                
                if (!profileCleanupError) {
                  return { success: true };
                }
              }
              
              throw deleteError;
            }

            if (import.meta.env.MODE === 'development') {
              console.log('User deletion completed successfully');
            }
            return { success: true };
          } catch (error) {
            console.error('Error deleting user:', error);
            
            // Provide more specific error messages
            if (error instanceof Error) {
              if (error.message.includes('foreign key')) {
                throw new Error('Cannot delete user: User has related data that must be removed first.');
              } else if (error.message.includes('Database error')) {
                throw new Error('Database error occurred while deleting user. Please try again or contact support.');
              }
            }
            
            throw error;
          }
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Grant permission to user
    grantPermission: builder.mutation<{ success: boolean }, { userId: string; permission: string }>({
      query: ({ userId, permission }) => ({
        supabaseOperation: async () => {
          try {
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('Not authenticated');

            const { error } = await supabase.rpc('grant_user_permission', {
              target_user_id: userId,
              permission_name: permission,
              granted_by_user_id: currentUser.id,
            });

            if (error) throw error;
            return { success: true };
          } catch (error) {
            console.error('Error granting permission:', error);
            throw error;
          }
        }
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Revoke permission from user
    revokePermission: builder.mutation<{ success: boolean }, { userId: string; permission: string }>({
      query: ({ userId, permission }) => ({
        supabaseOperation: async () => {
          try {
            const currentUser = (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('Not authenticated');

            const { error } = await supabase.rpc('revoke_user_permission', {
              target_user_id: userId,
              permission_name: permission,
              revoked_by_user_id: currentUser.id,
            });

            if (error) throw error;
            return { success: true };
          } catch (error) {
            console.error('Error revoking permission:', error);
            throw error;
          }
        }
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Get user permissions
    getUserPermissions: builder.query<UserPermission[], string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          try {
            const { data, error } = await supabase
              .from('user_permissions')
              .select('*')
              .eq('user_id', userId);

            if (error) throw error;
            return data || [];
          } catch (error) {
            console.error('Error fetching user permissions:', error);
            throw error;
          }
        }
      }),
      providesTags: (result, error, userId) => [{ type: 'UserPermission', id: userId }],
    }),

    // Get user sessions
    getUserSessions: builder.query<UserSession[], string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          try {
            const { data, error } = await supabase
              .from('user_sessions')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
          } catch (error) {
            console.error('Error fetching user sessions:', error);
            throw error;
          }
        }
      }),
      providesTags: (result, error, userId) => [{ type: 'UserSession', id: userId }],
    }),

    // Get current user profile
    getCurrentUser: builder.query<UserResponse, void>({
      query: () => ({
        supabaseOperation: async () => {
          console.log('[UserManagementAPI] Getting current user...');
          
          try {
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            console.log('[UserManagementAPI] Current auth user:', { 
              id: currentUser?.id, 
              email: currentUser?.email,
              authError 
            });
            
            if (authError) throw authError;
            if (!currentUser) return { data: null };

            // Get profile data with permissions using RPC function
            let userData;
            try {
              // Try using the get_user_with_role function first
              const { data: userWithRole, error: rpcError } = await supabase
                .rpc('get_user_with_role', { user_id: currentUser.id })
                .single();
              
              console.log('[UserManagementAPI] get_user_with_role result:', {
                hasData: !!userWithRole,
                role: userWithRole?.role,
                permissions: userWithRole?.permissions,
                rpcError
              });
              
              if (!rpcError && userWithRole) {
                userData = userWithRole;
              }
            } catch (rpcErr) {
              console.warn('get_user_with_role failed, falling back to direct query:', rpcErr);
            }
            
            // Fallback to direct profile query if RPC fails
            if (!userData) {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

              console.log('[UserManagementAPI] Profile query result:', {
                hasProfile: !!profile,
                profileRole: profile?.role,
                profileError
              });
              
              userData = profile;
              
              if (profileError && profileError.code !== 'PGRST116') {
                // Ignore "not found" errors, create minimal user data
                console.warn('Profile not found for current user:', profileError);
              }
            }

            // Combine the data
            const finalUserData = {
              id: currentUser.id,
              email: userData?.email || currentUser.email || '',
              first_name: userData?.first_name || '',
              last_name: userData?.last_name || '',
              role: userData?.role || 'staff',
              is_active: userData?.is_active ?? true,
              phone: userData?.phone,
              avatar_url: userData?.avatar_url,
              created_at: userData?.created_at || currentUser.created_at,
              updated_at: userData?.updated_at,
              last_login_at: userData?.last_login_at || currentUser.last_sign_in_at,
              email_confirmed_at: currentUser.email_confirmed_at,
              permissions: userData?.permissions || [],
            };

            return { data: finalUserData };
          } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
          }
        }
      }),
      providesTags: ['CurrentUser'],
    }),
  }),
});

// Export hooks
export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  useGetUserPermissionsQuery,
  useGetUserSessionsQuery,
  useGetCurrentUserQuery,
  useLazyGetUsersQuery,
  useLazyGetUserQuery,
} = userManagementApi;