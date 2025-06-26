import { api } from './baseApi';
import supabase from '../../supabase';
import { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  UserFilters, 
  UserRole, 
  Organization, 
  OrganizationUser,
  CrossOrgPermission
} from '../../typings';

// Enhanced API request/response types
export interface UserListRequest {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  organization_id?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateUserRequest {
  userData: CreateUserData;
  organizationId?: string;
}

export interface UpdateUserRequest {
  id: string;
  updates: UpdateUserData;
}

export interface OrganizationMembershipRequest {
  user_id: string;
  organization_id: string;
  role: UserRole;
  permissions?: string[];
  is_primary?: boolean;
}

export interface CrossOrgPermissionRequest {
  user_id: string;
  organization_id: string;
  permission_type: 'issuer_access' | 'appraiser_access' | 'viewer_access' | 'consultant_access';
  permissions: string[];
  expires_at?: string;
  notes?: string;
}

export interface AuthResponse {
  user: User | null;
  organizations?: OrganizationUser[];
  session?: any;
  error?: string;
}

export interface UserWithOrganizations extends User {
  organizations: OrganizationUser[];
  current_organization?: Organization;
}

export interface OrganizationUsersResponse {
  users: UserWithOrganizations[];
  total: number;
  page: number;
  pageSize: number;
}

// Multi-tenant user API
export const multiTenantUserApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Enhanced authentication with organization context
    getCurrentUserWithOrganizations: builder.query<AuthResponse, void>({
      query: () => ({
        supabaseOperation: async () => {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (!session?.user) {
            return { user: null, organizations: [] };
          }

          // Get user profile with organization context
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          // Get user's organizations
          const { data: organizations, error: orgsError } = await supabase
            .from('organization_users')
            .select(`
              *,
              organization:organizations(*)
            `)
            .eq('user_id', session.user.id)
            .eq('is_active', true);

          if (orgsError) throw orgsError;

          const user: User = {
            id: profile.id,
            email: session.user.email!,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
            organization_id: profile.organization_id,
            is_active: profile.is_active,
            phone: profile.phone,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            last_login_at: profile.last_login_at,
            organizations: organizations || [],
          };

          return {
            user,
            organizations: organizations || [],
            session,
          };
        }
      }),
      providesTags: [{ type: 'User', id: 'CURRENT' }],
    }),

    // Get users with organization filtering
    getOrganizationUsers: builder.query<OrganizationUsersResponse, UserListRequest>({
      query: ({ page = 1, pageSize = 10, role, organization_id, isActive, search }) => ({
        supabaseOperation: async () => {
          let query = supabase
            .from('organization_users')
            .select(`
              *,
              user:profiles(*),
              organization:organizations(*)
            `, { count: 'exact' })
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order('created_at', { ascending: false });

          if (organization_id) {
            query = query.eq('organization_id', organization_id);
          }

          if (role) {
            query = query.eq('role', role);
          }

          if (isActive !== undefined) {
            query = query.eq('is_active', isActive);
          }

          const { data, error, count } = await query;
          if (error) throw error;

          // Transform data to include user details
          const users: UserWithOrganizations[] = (data || []).map(orgUser => ({
            ...orgUser.user,
            organizations: [orgUser],
            current_organization: orgUser.organization,
          }));

          // Apply search filter on transformed data if needed
          let filteredUsers = users;
          if (search) {
            filteredUsers = users.filter(user => 
              user.email?.toLowerCase().includes(search.toLowerCase()) ||
              user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
              user.last_name?.toLowerCase().includes(search.toLowerCase())
            );
          }

          return {
            users: filteredUsers,
            total: count || 0,
            page,
            pageSize,
          };
        }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // Create user with organization assignment
    createUser: builder.mutation<User, CreateUserRequest>({
      query: ({ userData, organizationId }) => ({
        supabaseOperation: async () => {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
          });

          if (authError) throw authError;

          const userId = authData.user.id;

          // Create profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role || 'viewer',
              organization_id: organizationId,
              phone: userData.phone,
              is_active: true,
            })
            .select()
            .single();

          if (profileError) throw profileError;

          // Add to organization if specified
          if (organizationId) {
            const { error: orgUserError } = await supabase
              .from('organization_users')
              .insert({
                user_id: userId,
                organization_id: organizationId,
                role: userData.role || 'viewer',
                permissions: userData.permissions || [],
                is_primary: true,
                is_active: true,
              });

            if (orgUserError) throw orgUserError;
          }

          return {
            id: profile.id,
            email: userData.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
            organization_id: profile.organization_id,
            is_active: profile.is_active,
            phone: profile.phone,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };
        }
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'Statistics', id: 'USER' },
      ],
    }),

    // Update user with organization context
    updateUser: builder.mutation<User, UpdateUserRequest>({
      query: ({ id, updates }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .update({
              first_name: updates.first_name,
              last_name: updates.last_name,
              role: updates.role,
              organization_id: updates.organization_id,
              is_active: updates.is_active,
              phone: updates.phone,
              avatar_url: updates.avatar_url,
              updated_at: new Date().toISOString(),
            })
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
        { type: 'User', id: 'CURRENT' },
      ],
    }),

    // Manage organization membership
    addUserToOrganization: builder.mutation<OrganizationUser, OrganizationMembershipRequest>({
      query: ({ user_id, organization_id, role, permissions, is_primary }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organization_users')
            .insert({
              user_id,
              organization_id,
              role,
              permissions: permissions || [],
              is_primary: is_primary || false,
              is_active: true,
            })
            .select(`
              *,
              organization:organizations(*)
            `)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateOrganizationMembership: builder.mutation<OrganizationUser, OrganizationMembershipRequest & { membership_id: string }>({
      query: ({ membership_id, role, permissions, is_primary }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organization_users')
            .update({
              role,
              permissions: permissions || [],
              is_primary: is_primary || false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', membership_id)
            .select(`
              *,
              organization:organizations(*)
            `)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    removeUserFromOrganization: builder.mutation<{ success: boolean }, { user_id: string; organization_id: string }>({
      query: ({ user_id, organization_id }) => ({
        supabaseOperation: async () => {
          const { error } = await supabase
            .from('organization_users')
            .update({ 
              is_active: false,
              deleted_at: new Date().toISOString() 
            })
            .eq('user_id', user_id)
            .eq('organization_id', organization_id);

          if (error) throw error;

          return { success: true };
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // Cross-organizational permissions
    grantCrossOrgPermission: builder.mutation<CrossOrgPermission, CrossOrgPermissionRequest>({
      query: ({ user_id, organization_id, permission_type, permissions, expires_at, notes }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('cross_org_permissions')
            .insert({
              user_id,
              organization_id,
              permission_type,
              permissions,
              expires_at,
              notes,
              is_active: true,
            })
            .select(`
              *,
              organization:organizations(*)
            `)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    revokeCrossOrgPermission: builder.mutation<{ success: boolean }, string>({
      query: (permissionId) => ({
        supabaseOperation: async () => {
          const { error } = await supabase
            .from('cross_org_permissions')
            .update({ 
              is_active: false,
              deleted_at: new Date().toISOString() 
            })
            .eq('id', permissionId);

          if (error) throw error;

          return { success: true };
        }
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // Get user's cross-org permissions
    getUserCrossOrgPermissions: builder.query<CrossOrgPermission[], string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('cross_org_permissions')
            .select(`
              *,
              organization:organizations(*)
            `)
            .eq('user_id', userId)
            .eq('is_active', true);

          if (error) throw error;

          return data || [];
        }
      }),
      providesTags: (result, error, userId) => [
        { type: 'User', id: `CROSS_ORG_${userId}` }
      ],
    }),

    // Enhanced user statistics with organization context
    getMultiTenantUserStats: builder.query<{
      totalUsers: number;
      activeUsers: number;
      usersByRole: Record<string, number>;
      usersByOrganization: Record<string, number>;
      recentSignups: number;
      crossOrgUsers: number;
    }, { organizationId?: string }>({
      query: ({ organizationId }) => ({
        supabaseOperation: async () => {
          let userQuery = supabase
            .from('organization_users')
            .select(`
              role,
              is_active,
              created_at,
              organization_id,
              user:profiles(*)
            `);

          if (organizationId) {
            userQuery = userQuery.eq('organization_id', organizationId);
          }

          const { data: orgUsers, error } = await userQuery;
          if (error) throw error;

          // Get cross-org permissions count
          const { data: crossOrgPerms, error: crossOrgError } = await supabase
            .from('cross_org_permissions')
            .select('user_id')
            .eq('is_active', true);

          if (crossOrgError) throw crossOrgError;

          const now = new Date();
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          const stats = {
            totalUsers: orgUsers?.length || 0,
            activeUsers: orgUsers?.filter(u => u.is_active).length || 0,
            usersByRole: {} as Record<string, number>,
            usersByOrganization: {} as Record<string, number>,
            recentSignups: orgUsers?.filter(u => new Date(u.created_at) > lastWeek).length || 0,
            crossOrgUsers: new Set(crossOrgPerms?.map(p => p.user_id)).size || 0,
          };

          orgUsers?.forEach(orgUser => {
            if (orgUser.role) {
              stats.usersByRole[orgUser.role] = (stats.usersByRole[orgUser.role] || 0) + 1;
            }
            if (orgUser.organization_id) {
              stats.usersByOrganization[orgUser.organization_id] = 
                (stats.usersByOrganization[orgUser.organization_id] || 0) + 1;
            }
          });

          return stats;
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'MULTI_TENANT_USER' }],
    }),
  }),
});

// Export hooks
export const {
  useGetCurrentUserWithOrganizationsQuery,
  useGetOrganizationUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useAddUserToOrganizationMutation,
  useUpdateOrganizationMembershipMutation,
  useRemoveUserFromOrganizationMutation,
  useGrantCrossOrgPermissionMutation,
  useRevokeCrossOrgPermissionMutation,
  useGetUserCrossOrgPermissionsQuery,
  useGetMultiTenantUserStatsQuery,
} = multiTenantUserApi;