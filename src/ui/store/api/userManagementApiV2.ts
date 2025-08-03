import { api } from './baseApi';
import { edgeFunctions } from '../../services/edgeFunctions';
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
  last_sign_in_at?: string;
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
  sortBy?: 'created_at' | 'first_name' | 'last_name' | 'email' | 'last_sign_in_at';
  sortOrder?: 'asc' | 'desc';
}

// Inject user management endpoints using Edge Functions
export const userManagementApiV2 = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users with roles and permissions
    getUsers: builder.query<UserListResponse, UserListRequest>({
      query: ({ page = 1, pageSize = 10, filters = {}, sortBy = 'created_at', sortOrder = 'desc' }) => ({
        supabaseOperation: async () => {
          const response = await edgeFunctions.users.listUsers({
            filters,
            pagination: { page, pageSize, sortBy, sortOrder }
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return {
            data: response.data?.data || [],
            count: response.data?.count || 0,
          };
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
          const response = await edgeFunctions.users.getUser(userId);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { data: response.data };
        }
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Create new user (admin only)
    createUser: builder.mutation<UserResponse, CreateUserRequest>({
      query: (userData) => ({
        supabaseOperation: async () => {
          // Upload avatar first if provided
          let avatarUrl = userData.avatar_url;
          if (userData.avatar_file) {
            // Handle avatar upload to Supabase Storage
            const fileExt = userData.avatar_file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('user-avatars')
              .upload(filePath, userData.avatar_file, {
                cacheControl: '3600',
                upsert: true
              });

            if (!uploadError) {
              const { data } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filePath);
              avatarUrl = data.publicUrl;
            }
          }

          const response = await edgeFunctions.users.createUser({
            email: userData.email,
            password: userData.password,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role || 'staff',
            phone: userData.phone,
            avatar_url: avatarUrl,
            permissions: userData.permissions || []
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { data: response.data };
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // Update user
    updateUser: builder.mutation<UserResponse, UpdateUserRequest>({
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
              .upload(filePath, updateData.avatar_file, {
                cacheControl: '3600',
                upsert: true
              });

            if (!uploadError) {
              const { data } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filePath);
              avatarUrl = data.publicUrl;
            }
          }

          const response = await edgeFunctions.users.updateUser(updateData.id, {
            first_name: updateData.first_name,
            last_name: updateData.last_name,
            role: updateData.role,
            is_active: updateData.is_active,
            phone: updateData.phone,
            avatar_url: avatarUrl
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { data: response.data };
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
          const response = await edgeFunctions.users.deleteUser(userId);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Disable user
    disableUser: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const response = await edgeFunctions.users.disableUser(userId);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Enable user
    enableUser: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const response = await edgeFunctions.users.enableUser(userId);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Assign role to user
    assignRole: builder.mutation<{ success: boolean }, { userId: string; role: UserRole }>({
      query: ({ userId, role }) => ({
        supabaseOperation: async () => {
          const response = await edgeFunctions.roles.assignRole(userId, role);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Grant permission to user
    grantPermission: builder.mutation<{ success: boolean }, { userId: string; permission: string }>({
      query: ({ userId, permission }) => ({
        supabaseOperation: async () => {
          const response = await edgeFunctions.roles.grantPermission(userId, permission);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Revoke permission from user
    revokePermission: builder.mutation<{ success: boolean }, { userId: string; permission: string }>({
      query: ({ userId, permission }) => ({
        supabaseOperation: async () => {
          const response = await edgeFunctions.roles.revokePermission(userId, permission);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Get user permissions
    getUserPermissions: builder.query<any, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const response = await edgeFunctions.roles.listPermissions(userId);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return response.data;
        }
      }),
      providesTags: (result, error, userId) => [{ type: 'UserPermission', id: userId }],
    }),

    // Get current user profile
    getCurrentUser: builder.query<UserResponse, void>({
      query: () => ({
        supabaseOperation: async () => {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (!currentUser) {
            return { data: null };
          }

          const response = await edgeFunctions.users.getUser(currentUser.id);
          
          if (response.error) {
            // Fallback to basic user info if Edge Function fails
            return {
              data: {
                id: currentUser.id,
                email: currentUser.email || '',
                first_name: '',
                last_name: '',
                role: 'staff' as UserRole,
                is_active: true,
                phone: '',
                avatar_url: '',
                created_at: currentUser.created_at,
                updated_at: '',
                last_sign_in_at: currentUser.last_sign_in_at,
                email_confirmed_at: currentUser.email_confirmed_at,
                permissions: [],
              }
            };
          }
          
          return { data: response.data };
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
  useDisableUserMutation,
  useEnableUserMutation,
  useAssignRoleMutation,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  useGetUserPermissionsQuery,
  useGetCurrentUserQuery,
  useLazyGetUsersQuery,
  useLazyGetUserQuery,
} = userManagementApiV2;