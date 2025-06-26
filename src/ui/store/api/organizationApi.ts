import { api } from './baseApi';
import supabase from '../../supabase';
import { 
  Organization, 
  CreateOrganizationData, 
  UpdateOrganizationData, 
  OrganizationFilters,
  OrganizationType,
  OrganizationStats
} from '../../typings';

export interface OrganizationListRequest {
  page?: number;
  pageSize?: number;
  type?: OrganizationType;
  isActive?: boolean;
  search?: string;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  page: number;
  pageSize: number;
}

// Organization management API
export const organizationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get organizations list
    getOrganizations: builder.query<OrganizationsResponse, OrganizationListRequest>({
      query: ({ page = 1, pageSize = 10, type, isActive, search }) => ({
        supabaseOperation: async () => {
          let query = supabase
            .from('organizations')
            .select('*', { count: 'exact' })
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order('created_at', { ascending: false });

          if (type) {
            query = query.eq('type', type);
          }

          if (isActive !== undefined) {
            query = query.eq('is_active', isActive);
          }

          if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
          }

          const { data, error, count } = await query;
          if (error) throw error;

          return {
            organizations: data || [],
            total: count || 0,
            page,
            pageSize,
          };
        }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.organizations.map(({ id }) => ({ type: 'Organization' as const, id })),
              { type: 'Organization', id: 'LIST' },
            ]
          : [{ type: 'Organization', id: 'LIST' }],
    }),

    // Get single organization
    getOrganization: builder.query<Organization, string>({
      query: (id) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      providesTags: (result, error, id) => [{ type: 'Organization', id }],
    }),

    // Create organization
    createOrganization: builder.mutation<Organization, CreateOrganizationData>({
      query: (organizationData) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organizations')
            .insert({
              name: organizationData.name,
              type: organizationData.type,
              description: organizationData.description,
              website: organizationData.website,
              contact_email: organizationData.contact_email,
              contact_phone: organizationData.contact_phone,
              address: organizationData.address,
              settings: organizationData.settings || {},
              is_active: true,
            })
            .select()
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: [
        { type: 'Organization', id: 'LIST' },
        { type: 'Statistics', id: 'ORGANIZATION' },
      ],
    }),

    // Update organization
    updateOrganization: builder.mutation<Organization, UpdateOrganizationData>({
      query: ({ id, ...updates }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organizations')
            .update({
              ...updates,
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
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
      ],
    }),

    // Delete organization (soft delete)
    deleteOrganization: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        supabaseOperation: async () => {
          const { error } = await supabase
            .from('organizations')
            .update({ 
              is_active: false,
              deleted_at: new Date().toISOString() 
            })
            .eq('id', id);

          if (error) throw error;

          return { success: true };
        }
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
        { type: 'Statistics', id: 'ORGANIZATION' },
      ],
    }),

    // Get organization statistics
    getOrganizationStats: builder.query<OrganizationStats, string>({
      query: (organizationId) => ({
        supabaseOperation: async () => {
          // Get user count
          const { data: users, error: usersError } = await supabase
            .from('organization_users')
            .select('is_active')
            .eq('organization_id', organizationId);

          if (usersError) throw usersError;

          // Get artwork count
          const { data: artworks, error: artworksError } = await supabase
            .from('artworks')
            .select('id')
            .eq('organization_id', organizationId)
            .is('deleted_at', null);

          if (artworksError) throw artworksError;

          // Get NFC tags count
          const { data: tags, error: tagsError } = await supabase
            .from('tags')
            .select('active')
            .eq('organization_id', organizationId);

          if (tagsError) throw tagsError;

          // Get appraisals count
          const { data: appraisals, error: appraisalsError } = await supabase
            .from('artwork_appraisals')
            .select('id')
            .in('artwork_id', (artworks || []).map(a => a.id));

          if (appraisalsError) throw appraisalsError;

          // Calculate recent activity (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: recentActivity, error: activityError } = await supabase
            .from('artwork_update_log')
            .select('id')
            .gte('updated_at', thirtyDaysAgo.toISOString())
            .in('artwork_id', (artworks || []).map(a => a.id));

          if (activityError) throw activityError;

          return {
            total_users: users?.length || 0,
            active_users: users?.filter(u => u.is_active).length || 0,
            total_artworks: artworks?.length || 0,
            total_nfc_tags: tags?.length || 0,
            active_nfc_tags: tags?.filter(t => t.active).length || 0,
            total_appraisals: appraisals?.length || 0,
            recent_activity: recentActivity?.length || 0,
          };
        }
      }),
      providesTags: (result, error, organizationId) => [
        { type: 'Statistics', id: `ORG_${organizationId}` }
      ],
    }),

    // Get user's accessible organizations
    getUserOrganizations: builder.query<Organization[], string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organization_users')
            .select(`
              organization:organizations(*)
            `)
            .eq('user_id', userId)
            .eq('is_active', true);

          if (error) throw error;

          return (data || []).map(item => item.organization).filter(Boolean);
        }
      }),
      providesTags: (result, error, userId) => [
        { type: 'Organization', id: `USER_${userId}` }
      ],
    }),

    // Get organization members
    getOrganizationMembers: builder.query<any[], string>({
      query: (organizationId) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organization_users')
            .select(`
              *,
              user:profiles(*)
            `)
            .eq('organization_id', organizationId)
            .eq('is_active', true);

          if (error) throw error;

          return data || [];
        }
      }),
      providesTags: (result, error, organizationId) => [
        { type: 'Organization', id: `MEMBERS_${organizationId}` }
      ],
    }),

    // Get organization settings
    getOrganizationSettings: builder.query<any, string>({
      query: (organizationId) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organizations')
            .select('settings')
            .eq('id', organizationId)
            .single();

          if (error) throw error;

          return data?.settings || {};
        }
      }),
      providesTags: (result, error, organizationId) => [
        { type: 'Organization', id: `SETTINGS_${organizationId}` }
      ],
    }),

    // Update organization settings
    updateOrganizationSettings: builder.mutation<any, { organizationId: string; settings: any }>({
      query: ({ organizationId, settings }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('organizations')
            .update({ 
              settings,
              updated_at: new Date().toISOString() 
            })
            .eq('id', organizationId)
            .select('settings')
            .single();

          if (error) throw error;

          return data?.settings || {};
        }
      }),
      invalidatesTags: (result, error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        { type: 'Organization', id: `SETTINGS_${organizationId}` },
      ],
    }),

    // Get all organization statistics
    getAllOrganizationStats: builder.query<{
      totalOrganizations: number;
      activeOrganizations: number;
      organizationsByType: Record<string, number>;
      recentOrganizations: number;
    }, void>({
      query: () => ({
        supabaseOperation: async () => {
          const { data: organizations, error } = await supabase
            .from('organizations')
            .select('type, is_active, created_at');

          if (error) throw error;

          const now = new Date();
          const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const stats = {
            totalOrganizations: organizations?.length || 0,
            activeOrganizations: organizations?.filter(o => o.is_active).length || 0,
            organizationsByType: {} as Record<string, number>,
            recentOrganizations: organizations?.filter(o => new Date(o.created_at) > lastMonth).length || 0,
          };

          organizations?.forEach(org => {
            if (org.type) {
              stats.organizationsByType[org.type] = (stats.organizationsByType[org.type] || 0) + 1;
            }
          });

          return stats;
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'ALL_ORGANIZATIONS' }],
    }),
  }),
});

// Export hooks
export const {
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetOrganizationStatsQuery,
  useGetUserOrganizationsQuery,
  useGetOrganizationMembersQuery,
  useGetOrganizationSettingsQuery,
  useUpdateOrganizationSettingsMutation,
  useGetAllOrganizationStatsQuery,
} = organizationApi;