import { api } from './baseApi';
import supabase from '../../supabase';
import { createUserWithProfile, updateUserProfile, softDeleteUser, getOrganizationUsers } from '../../supabase/rpc';

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
  organization_id?: string;
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
  organizationId?: string;
}

// Inject user management endpoints
export const userManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users with roles and permissions
    getUsers: builder.query<UserListResponse, UserListRequest>({
      query: ({ page = 1, pageSize = 10, filters = {}, sortBy = 'created_at', sortOrder = 'desc', organizationId }) => ({
        supabaseOperation: async () => {
          try {
            // Check if we have proper access
            const { data: currentUser, error: authError } = await supabase.auth.getUser();
            if (!currentUser?.user) {
              throw new Error('Not authenticated');
            }
            
            // Use regular supabase client with RLS
            const client = supabase;
            
            // Fetch profiles
            let profilesData = null;
            let profilesError = null;
            let count = 0;
            
            try {
              // First try with the full query
              let query;
              let result;
              
              // If organizationId is provided and we need to filter by organization
              if (organizationId) {
                // Use regular supabase client since it works with proper permissions
                // First get the user IDs from organization_users
                const { data: orgUsers, error: orgError } = await supabase
                    .from('organization_users')
                    .select('user_id, role, permissions')
                    .eq('organization_id', organizationId)
                    .eq('is_active', true);
                  
                  if (orgError) {
                    // Fall back to getting all profiles without org filtering
                    query = client.from('profiles').select('*', { count: 'exact' });
                    result = await query
                      .order(sortBy, { ascending: sortOrder === 'asc' })
                      .range((page - 1) * pageSize, page * pageSize - 1);
                    
                    profilesData = result.data;
                    profilesError = result.error;
                    count = result.count || 0;
                  } else if (orgUsers && orgUsers.length > 0) {
                    // Create a map of user_id to org data for easy lookup
                    const orgUserMap = new Map(orgUsers.map(ou => [ou.user_id, ou]));
                    const userIds = orgUsers.map(ou => ou.user_id);
                    
                    // Now get the profiles for these users
                    const profilesQuery = client
                      .from('profiles')
                      .select('*', { count: 'exact' })
                      .in('id', userIds)
                      .order(sortBy, { ascending: sortOrder === 'asc' })
                      .range((page - 1) * pageSize, page * pageSize - 1);
                    
                    result = await profilesQuery;
                    
                    // Add organization data to profiles
                    if (result.data) {
                      profilesData = result.data.map(profile => ({
                        ...profile,
                        organization_users: [{
                          role: orgUserMap.get(profile.id)?.role,
                          permissions: orgUserMap.get(profile.id)?.permissions
                        }]
                      }));
                    } else {
                      profilesData = result.data;
                    }
                    profilesError = result.error;
                    count = result.count || 0;
                  } else {
                    // No users in this organization
                    profilesData = [];
                    profilesError = null;
                    count = 0;
                  }
              } else {
                // For no organization filter, just get all profiles
                query = client.from('profiles').select('*', { count: 'exact' });
                result = await query
                  .order(sortBy, { ascending: sortOrder === 'asc' })
                  .range((page - 1) * pageSize, page * pageSize - 1);
                
                profilesData = result.data;
                profilesError = result.error;
                count = result.count || 0;
              }
              
              
              // If we get a 500 error, try a simpler query
              if (result?.status === 500 || (profilesError && profilesError.message?.includes('500'))) {
                
                // Try without count and pagination
                let simpleQuery = client.from('profiles');
                
                if (organizationId) {
                  try {
                    // Use RPC function for organization filtering
                    const { data: orgUsers, error: rpcError } = await client
                      .rpc('get_organization_users_secure', { p_organization_id: organizationId });
                    
                    if (!rpcError && orgUsers) {
                      const userIds = orgUsers.map(u => u.user_id);
                      simpleQuery = simpleQuery.select('*')
                        .in('id', userIds);
                    } else {
                      simpleQuery = simpleQuery.select('*');
                    }
                  } catch (error) {
                    simpleQuery = simpleQuery.select('*');
                  }
                } else {
                  simpleQuery = simpleQuery.select('*');
                }
                
                const simpleResult = await simpleQuery.limit(pageSize);
                
                if (!simpleResult.error) {
                  profilesData = simpleResult.data;
                  profilesError = null;
                  count = simpleResult.data?.length || 0;
                }
              }
            } catch (error) {
              profilesError = error;
            }

            if (profilesError) {
              
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

            // Auth user emails will be handled separately
            let authUsersMap = new Map();

            // If no profiles data, try to at least show current user
            if (!profilesData || profilesData.length === 0) {
              
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
              
              // If we have organization_users data from the join, use it
              const orgUser = profile.organization_users?.[0];
              const permissions = orgUser?.permissions || profile.permissions || [];
              const role = orgUser?.role || profile.role || 'staff';
              
              return {
                id: profile.id,
                email: authUser?.email || profile.email || currentUser.user?.email || '',
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                role: role,
                is_active: profile.is_active ?? true,
                phone: profile.phone,
                avatar_url: profile.avatar_url,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                last_login_at: profile.last_login_at || authUser?.last_sign_in_at,
                email_confirmed_at: authUser?.email_confirmed_at,
                permissions: permissions,
              };
            }) || [];

            // Organization filtering is now handled at the database level through the join
            let filteredUsers = combinedUsers;
            
            // Apply other filters
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

            // Get the auth user data for email if it's the current user
            let authUser = null;
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user && user.id === userId) {
                authUser = { user };
              }
            } catch (error) {
              // Failed to fetch auth user
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
            // Check if we need to use Edge Function for user creation
            // The RPC function will handle permission checks
            const useEdgeFunction = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL;
            
            if (useEdgeFunction) {
              // Call Edge Function for secure user creation
              const response = await fetch(`${useEdgeFunction}/create-user`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify(userData)
              });
              
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create user');
              }
              
              const result = await response.json();
              return { data: result.user };
            }

            // Use the secure RPC function to create user
            const { data: createResult, error: createError } = await createUserWithProfile({
              email: userData.email,
              password: userData.password,
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role || 'staff',
              phone: userData.phone,
              organization_id: userData.organization_id,
              permissions: userData.permissions || []
            });
            
            if (createError) {
              console.error('Error creating user:', createError);
              throw new Error(createError.message);
            }
            
            if (!createResult || !createResult.id) {
              throw new Error('Failed to create user - no user data returned');
            }
            
            // The RPC function returns a flag if auth creation is needed
            if (createResult.requires_auth_creation) {
              // This means we need to use Edge Function to create the auth user
              throw new Error('User profile created but auth user creation requires Edge Function. Please ensure Edge Function is configured.');
            }
            
            const userId = createResult.id;

            // Upload avatar if provided
            let avatarUrl = createResult.avatar_url;
            if (userData.avatar_file && userId) {
              try {
                const fileExt = userData.avatar_file.name.split('.').pop();
                const fileName = `${userId}-${Date.now()}.${fileExt}`;
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
                  
                  // Update user profile with avatar URL
                  await updateUserProfile({
                    user_id: userId,
                    avatar_url: avatarUrl
                  });
                }
              } catch (avatarError) {
                console.error('Avatar upload failed, continuing without avatar:', avatarError);
              }
            }

            // Profile is already created by the RPC function
            // Organization association is handled by the RPC function

            // Permissions are handled by the RPC function

            // Format the user data from RPC response
            const createdUser = {
              id: userId,
              email: createResult.email || userData.email,
              first_name: createResult.first_name || '',
              last_name: createResult.last_name || '',
              role: createResult.role as UserRole,
              is_active: createResult.is_active ?? true,
              phone: createResult.phone || '',
              avatar_url: avatarUrl || createResult.avatar_url,
              created_at: createResult.created_at,
              updated_at: createResult.updated_at,
              last_login_at: null,
              email_confirmed_at: null,
              permissions: userData.permissions || [],
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

            // Use secure RPC for all user updates

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
                  throw uploadError;
                } else {
                  const { data } = supabase.storage
                    .from('user-avatars')
                    .getPublicUrl(filePath);
                  avatarUrl = data.publicUrl;
                }
              } catch (avatarError) {
                throw new Error('Failed to upload avatar');
              }
            }

            // Use secure RPC function to update user
            const { data: updateResult, error: updateError } = await updateUserProfile({
              user_id: updateData.id,
              first_name: updateData.first_name,
              last_name: updateData.last_name,
              role: updateData.role,
              is_active: updateData.is_active,
              phone: updateData.phone,
              avatar_url: avatarUrl
            });

            if (updateError) {
              console.error('Profile update error:', updateError);
              throw new Error(updateError.message);
            }

            if (!updateResult) {
              throw new Error('Failed to update user profile');
            }

            // Get updated user data
            const { data: profile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', updateData.id)
              .single();

            if (fetchError) throw fetchError;

            // Get auth user email
            let email = '';
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user && user.id === updateData.id) {
                email = user.email || '';
              }
            } catch (error) {
              console.error('Failed to fetch auth user email:', error);
            }

            // Format the response
            const updatedUser = {
              id: profile.id,
              email: email,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              role: profile.role as UserRole,
              is_active: profile.is_active ?? true,
              phone: profile.phone || '',
              avatar_url: profile.avatar_url || '',
              created_at: profile.created_at,
              updated_at: profile.updated_at,
              last_login_at: profile.last_login_at,
              email_confirmed_at: null,
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
            if (import.meta.env.MODE === 'development') {
              console.log('Starting user deletion process for userId:', userId);
            }

            // First, get user's profile data including avatar URL for cleanup
            const { data: profile, error: profileFetchError } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', userId)
              .single();

            if (profileFetchError && profileFetchError.code !== 'PGRST116') {
              console.error('Error fetching user profile:', profileFetchError);
              // Continue with deletion even if profile fetch fails
            }

            // Use secure RPC function to soft delete user
            const { data: deleteResult, error: deleteError } = await softDeleteUser(userId);
            
            if (deleteError) {
              console.error('Error deleting user:', deleteError);
              throw new Error(deleteError.message);
            }
            
            // Delete avatar from storage if it exists
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