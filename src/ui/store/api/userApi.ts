import { api } from './baseApi';
import supabase from '../../supabase';

// User-related types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'viewer';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  permissions?: string[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  bio?: string;
  website?: string;
  location?: string;
  preferences: Record<string, any>;
}

export interface UpdateUserRequest {
  id: string;
  updates: Partial<User>;
}

export interface UpdateProfileRequest {
  user_id: string;
  updates: Partial<UserProfile>;
}

export interface UserListRequest {
  page?: number;
  pageSize?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface AuthResponse {
  user: User | null;
  session: any | null;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

// Inject user-related endpoints
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: ({ email, password }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          return {
            user: data.user,
            session: data.session,
          };
        }
      }),
      invalidatesTags: ['User'],
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        supabaseOperation: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          return { success: true };
        }
      }),
      invalidatesTags: ['User'],
    }),

    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: ({ email, password, name }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              }
            }
          });

          if (error) throw error;

          return {
            user: data.user,
            session: data.session,
          };
        }
      }),
    }),

    // Get current user session
    getCurrentUser: builder.query<AuthResponse, void>({
      query: () => ({
        supabaseOperation: async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          return {
            user: session?.user || null,
            session,
          };
        }
      }),
      providesTags: [{ type: 'User', id: 'CURRENT' }],
    }),

    // User management endpoints
    getUsers: builder.query<{
      data: User[];
      count: number;
    }, UserListRequest>({
      query: ({ page = 1, pageSize = 10, role, isActive, search }) => ({
        supabaseOperation: async () => {
          let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order('created_at', { ascending: false });

          if (role) {
            query = query.eq('role', role);
          }

          if (isActive !== undefined) {
            query = query.eq('is_active', isActive);
          }

          if (search) {
            query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
          }

          const { data, error, count } = await query;
          if (error) throw error;

          return { data: data || [], count: count || 0 };
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

    getUser: builder.query<User, string>({
      query: (id) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          return data;
        }
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    updateUser: builder.mutation<User, UpdateUserRequest>({
      query: ({ id, updates }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // User profile endpoints
    getUserProfile: builder.query<UserProfile, string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
          return data;
        }
      }),
      providesTags: (result, error, userId) => [{ type: 'User', id: `PROFILE_${userId}` }],
    }),

    updateUserProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
      query: ({ user_id, updates }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('user_profiles')
            .upsert({ user_id, ...updates })
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      }),
      invalidatesTags: (result, error, { user_id }) => [
        { type: 'User', id: `PROFILE_${user_id}` },
      ],
    }),

    // Get user statistics
    getUserStats: builder.query<{
      totalUsers: number;
      activeUsers: number;
      usersByRole: Record<string, number>;
      recentSignups: number;
    }, void>({
      query: () => ({
        supabaseOperation: async () => {
          const { data: users, error } = await supabase
            .from('profiles')
            .select('role, is_active, created_at');

          if (error) throw error;

          const now = new Date();
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          const stats = {
            totalUsers: users?.length || 0,
            activeUsers: users?.filter(u => u.is_active).length || 0,
            usersByRole: {} as Record<string, number>,
            recentSignups: users?.filter(u => new Date(u.created_at) > lastWeek).length || 0,
          };

          users?.forEach(user => {
            if (user.role) {
              stats.usersByRole[user.role] = (stats.usersByRole[user.role] || 0) + 1;
            }
          });

          return stats;
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'USER' }],
    }),
  }),
});

// Export hooks
export const {
  useLoginMutation,
  useLogoutMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetUserStatsQuery,
  useLazyGetCurrentUserQuery,
} = userApi;