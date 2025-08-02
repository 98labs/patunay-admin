import { api } from './baseApi';
import supabase from '../../supabase';

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

// Secure User Management API using RPC functions
export const userManagementApiSecure = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get users list using secure RPC function
    getUsersSecure: builder.query<UserListResponse, {
      organizationId?: string;
      search?: string;
      role?: UserRole;
      isActive?: boolean;
      page?: number;
      pageSize?: number;
    }>({
      query: ({ organizationId, search, role, isActive, page = 1, pageSize = 50 }) => ({
        supabaseOperation: async () => {
          const offset = (page - 1) * pageSize;
          
          const { data, error } = await supabase.rpc('get_organization_users', {
            p_organization_id: organizationId || null,
            p_search: search || null,
            p_role: role || null,
            p_is_active: isActive,
            p_limit: pageSize,
            p_offset: offset
          });

          if (error) throw error;
          
          return {
            data: data?.data || [],
            count: data?.count || 0
          };
        }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' }
            ]
          : [{ type: 'User', id: 'LIST' }]
    }),

    // Get single user
    getUserByIdSecure: builder.query<{ data: UserProfile }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          // First get from profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (profileError) throw profileError;

          // Get email from auth (if we have access)
          let email = '';
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === userId) {
              email = user.email || '';
            }
          } catch (e) {
            // Ignore auth errors
          }

          return {
            data: {
              ...profile,
              email
            }
          };
        }
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }]
    }),

    // Create user using secure RPC function + Edge Function
    createUserSecure: builder.mutation<{ data: UserProfile }, CreateUserRequest>({
      query: (userData) => ({
        supabaseOperation: async () => {
          // Upload avatar if provided
          let avatarUrl: string | undefined;
          if (userData.avatar_file) {
            const fileExt = userData.avatar_file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('user-avatars')
              .upload(filePath, userData.avatar_file);

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
              .from('user-avatars')
              .getPublicUrl(filePath);
              
            avatarUrl = publicUrl;
          }

          // Call RPC function to create user profile
          const { data: profileData, error: profileError } = await supabase.rpc('create_user_with_profile', {
            p_email: userData.email,
            p_password: userData.password,
            p_first_name: userData.first_name || null,
            p_last_name: userData.last_name || null,
            p_role: userData.role || 'staff',
            p_phone: userData.phone || null,
            p_avatar_url: avatarUrl || null,
            p_organization_id: userData.organization_id || null,
            p_permissions: userData.permissions || []
          });

          if (profileError) throw profileError;

          // If profile creation succeeded and requires auth creation
          if (profileData.requires_auth_creation) {
            // Call edge function to create auth user
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  email: profileData.auth_params.email,
                  password: profileData.auth_params.password,
                  userId: profileData.auth_params.user_id,
                  metadata: {
                    first_name: userData.first_name,
                    last_name: userData.last_name
                  }
                })
              }
            );

            if (!response.ok) {
              // Clean up the profile if auth creation failed
              await supabase
                .from('profiles')
                .delete()
                .eq('id', profileData.id);
              
              const error = await response.json();
              throw new Error(error.error || 'Failed to create auth user');
            }
          }

          return { data: profileData };
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }]
    }),

    // Update user using secure RPC function
    updateUserSecure: builder.mutation<{ data: UserProfile }, UpdateUserRequest>({
      query: (updateData) => ({
        supabaseOperation: async () => {
          // Upload new avatar if provided
          let avatarUrl = updateData.avatar_url;
          if (updateData.avatar_file) {
            const fileExt = updateData.avatar_file.name.split('.').pop();
            const fileName = `${updateData.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('user-avatars')
              .upload(filePath, updateData.avatar_file);

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
              .from('user-avatars')
              .getPublicUrl(filePath);
              
            avatarUrl = publicUrl;
          }

          // Call RPC function to update user
          const { data, error } = await supabase.rpc('update_user_profile', {
            p_user_id: updateData.id,
            p_first_name: updateData.first_name || null,
            p_last_name: updateData.last_name || null,
            p_role: updateData.role || null,
            p_is_active: updateData.is_active,
            p_phone: updateData.phone || null,
            p_avatar_url: avatarUrl || null
          });

          if (error) throw error;

          return { data };
        }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' }
      ]
    }),

    // Soft delete user using secure RPC function
    deleteUserSecure: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase.rpc('soft_delete_user', {
            p_user_id: userId
          });

          if (error) throw error;

          return { success: true };
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' }
      ]
    }),
  }),
});

// Export hooks
export const {
  useGetUsersSecureQuery,
  useGetUserByIdSecureQuery,
  useCreateUserSecureMutation,
  useUpdateUserSecureMutation,
  useDeleteUserSecureMutation,
} = userManagementApiSecure;