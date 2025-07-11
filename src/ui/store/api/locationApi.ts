import { api } from './baseApi';
import supabase from '../../supabase';
import { 
  Location, 
  LocationUser,
  CreateLocationData, 
  UpdateLocationData, 
  LocationFilters,
  AssignUserToLocationData,
  LocationStats
} from '../../typings';

export interface LocationListRequest {
  page?: number;
  pageSize?: number;
  filters?: LocationFilters;
}

export interface LocationsResponse {
  locations: Location[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LocationUsersResponse {
  users: LocationUser[];
  total: number;
  page: number;
  pageSize: number;
}

// Location management API
export const locationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get locations list
    getLocations: builder.query<LocationsResponse, LocationListRequest>({
      query: ({ page = 1, pageSize = 10, filters = {} }) => ({
        supabaseOperation: async () => {
          let query = supabase
            .from('locations')
            .select(`
              *,
              organization:organizations(id, name, type),
              manager:profiles!locations_manager_id_fkey(id, first_name, last_name, email, avatar_url)
            `, { count: 'exact' })
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order('name', { ascending: true });

          // Apply filters
          if (filters.organization_id) {
            query = query.eq('organization_id', filters.organization_id);
          }

          if (filters.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active);
          }

          if (filters.is_headquarters !== undefined) {
            query = query.eq('is_headquarters', filters.is_headquarters);
          }

          if (filters.manager_id) {
            query = query.eq('manager_id', filters.manager_id);
          }

          if (filters.city) {
            query = query.ilike('city', `%${filters.city}%`);
          }

          if (filters.state) {
            query = query.ilike('state', `%${filters.state}%`);
          }

          if (filters.country) {
            query = query.ilike('country', `%${filters.country}%`);
          }

          if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
          }

          const { data, error, count } = await query;
          if (error) throw error;

          // Get user counts for each location
          const locationIds = data?.map(l => l.id) || [];
          if (locationIds.length > 0) {
            const { data: userCounts } = await supabase
              .from('location_users')
              .select('location_id')
              .in('location_id', locationIds)
              .eq('is_active', true);

            const countsMap = userCounts?.reduce((acc, lu) => {
              acc[lu.location_id] = (acc[lu.location_id] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {};

            // Add user counts to locations
            const locationsWithCounts = data?.map(loc => ({
              ...loc,
              user_count: countsMap[loc.id] || 0
            })) || [];

            return {
              locations: locationsWithCounts,
              total: count || 0,
              page,
              pageSize,
            };
          }

          return {
            locations: data || [],
            total: count || 0,
            page,
            pageSize,
          };
        }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.locations.map(({ id }) => ({ type: 'Location' as const, id })),
              { type: 'Location', id: 'LIST' },
            ]
          : [{ type: 'Location', id: 'LIST' }],
    }),

    // Get single location
    getLocation: builder.query<Location, string>({
      query: (id) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('locations')
            .select(`
              *,
              organization:organizations(id, name, type),
              manager:profiles!locations_manager_id_fkey(id, first_name, last_name, email, avatar_url)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;

          // Get user and artwork counts
          const [userCount, artworkCount] = await Promise.all([
            supabase
              .from('location_users')
              .select('id', { count: 'exact', head: true })
              .eq('location_id', id)
              .eq('is_active', true),
            supabase
              .from('artworks')
              .select('id', { count: 'exact', head: true })
              .eq('location_id', id)
              .is('deleted_at', null)
          ]);

          return {
            ...data,
            user_count: userCount.count || 0,
            artwork_count: artworkCount.count || 0
          };
        }
      }),
      providesTags: (result, error, id) => [{ type: 'Location', id }],
    }),

    // Create location
    createLocation: builder.mutation<Location, CreateLocationData>({
      query: (locationData) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('locations')
            .insert({
              ...locationData,
              address: {
                street: locationData.street,
                city: locationData.city,
                state: locationData.state,
                country: locationData.country,
                postal_code: locationData.postal_code
              }
            })
            .select(`
              *,
              organization:organizations(id, name, type),
              manager:profiles!locations_manager_id_fkey(id, first_name, last_name, email, avatar_url)
            `)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: [
        { type: 'Location', id: 'LIST' },
        { type: 'Statistics', id: 'LOCATION' },
      ],
    }),

    // Update location
    updateLocation: builder.mutation<Location, UpdateLocationData>({
      query: ({ id, ...updates }) => ({
        supabaseOperation: async () => {
          const updateData: any = { ...updates };
          
          // Handle address update
          if (updates.street || updates.city || updates.state || updates.country || updates.postal_code) {
            updateData.address = {
              street: updates.street,
              city: updates.city,
              state: updates.state,
              country: updates.country,
              postal_code: updates.postal_code
            };
          }

          const { data, error } = await supabase
            .from('locations')
            .update(updateData)
            .eq('id', id)
            .select(`
              *,
              organization:organizations(id, name, type),
              manager:profiles!locations_manager_id_fkey(id, first_name, last_name, email, avatar_url)
            `)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
    }),

    // Delete location (soft delete)
    deleteLocation: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        supabaseOperation: async () => {
          const { error } = await supabase
            .from('locations')
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
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
        { type: 'Statistics', id: 'LOCATION' },
      ],
    }),

    // Get location users
    getLocationUsers: builder.query<LocationUsersResponse, { locationId: string; page?: number; pageSize?: number }>({
      query: ({ locationId, page = 1, pageSize = 10 }) => ({
        supabaseOperation: async () => {
          const { data, error, count } = await supabase
            .from('location_users')
            .select(`
              *,
              location:locations(id, name, code),
              user:profiles(id, email, first_name, last_name, role, avatar_url, phone)
            `, { count: 'exact' })
            .eq('location_id', locationId)
            .eq('is_active', true)
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return {
            users: data || [],
            total: count || 0,
            page,
            pageSize,
          };
        }
      }),
      providesTags: (result, error, { locationId }) => [
        { type: 'Location', id: `USERS_${locationId}` }
      ],
    }),

    // Assign user to location
    assignUserToLocation: builder.mutation<LocationUser, AssignUserToLocationData>({
      query: (assignmentData) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('location_users')
            .insert(assignmentData)
            .select(`
              *,
              location:locations(id, name, code),
              user:profiles(id, email, first_name, last_name, role, avatar_url)
            `)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: (result, error, { location_id }) => [
        { type: 'Location', id: `USERS_${location_id}` },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Update user location assignment
    updateLocationUser: builder.mutation<LocationUser, { id: string; updates: Partial<AssignUserToLocationData> }>({
      query: ({ id, updates }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('location_users')
            .update(updates)
            .eq('id', id)
            .select(`
              *,
              location:locations(id, name, code),
              user:profiles(id, email, first_name, last_name, role, avatar_url)
            `)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: (result) => [
        { type: 'Location', id: `USERS_${result?.location_id}` },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Remove user from location
    removeUserFromLocation: builder.mutation<{ success: boolean }, { locationId: string; userId: string }>({
      query: ({ locationId, userId }) => ({
        supabaseOperation: async () => {
          const { error } = await supabase
            .from('location_users')
            .update({ 
              is_active: false,
              deleted_at: new Date().toISOString(),
              end_date: new Date().toISOString().split('T')[0]
            })
            .eq('location_id', locationId)
            .eq('user_id', userId);

          if (error) throw error;

          return { success: true };
        }
      }),
      invalidatesTags: (result, error, { locationId }) => [
        { type: 'Location', id: `USERS_${locationId}` },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Get user's locations
    getUserLocations: builder.query<Location[], string>({
      query: (userId) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .rpc('get_user_locations', { p_user_id: userId });

          if (error) throw error;

          return data || [];
        }
      }),
      providesTags: (result, error, userId) => [
        { type: 'Location', id: `USER_${userId}` }
      ],
    }),

    // Get location statistics
    getLocationStats: builder.query<LocationStats, string>({
      query: (locationId) => ({
        supabaseOperation: async () => {
          // Get user count
          const { data: users, error: usersError } = await supabase
            .from('location_users')
            .select('is_active')
            .eq('location_id', locationId);

          if (usersError) throw usersError;

          // Get artwork count
          const { data: artworks, error: artworksError } = await supabase
            .from('artworks')
            .select('id')
            .eq('location_id', locationId)
            .is('deleted_at', null);

          if (artworksError) throw artworksError;

          // Get appraisals count for location's artworks
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
            total_appraisals: appraisals?.length || 0,
            recent_activity: recentActivity?.length || 0,
          };
        }
      }),
      providesTags: (result, error, locationId) => [
        { type: 'Statistics', id: `LOCATION_${locationId}` }
      ],
    }),

    // Get all locations statistics
    getAllLocationStats: builder.query<{
      totalLocations: number;
      activeLocations: number;
      totalLocationUsers: number;
      locationsByCountry: Record<string, number>;
    }, string>({
      query: (organizationId) => ({
        supabaseOperation: async () => {
          const { data: locations, error } = await supabase
            .from('locations')
            .select('is_active, country')
            .eq('organization_id', organizationId);

          if (error) throw error;

          const { data: locationUsers, error: usersError } = await supabase
            .from('location_users')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('is_active', true);

          if (usersError) throw usersError;

          const stats = {
            totalLocations: locations?.length || 0,
            activeLocations: locations?.filter(l => l.is_active).length || 0,
            totalLocationUsers: locationUsers?.length || 0,
            locationsByCountry: {} as Record<string, number>,
          };

          locations?.forEach(location => {
            const country = location.country || 'Unknown';
            stats.locationsByCountry[country] = (stats.locationsByCountry[country] || 0) + 1;
          });

          return stats;
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'ALL_LOCATIONS' }],
    }),
  }),
});

// Export hooks
export const {
  useGetLocationsQuery,
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useGetLocationUsersQuery,
  useAssignUserToLocationMutation,
  useUpdateLocationUserMutation,
  useRemoveUserFromLocationMutation,
  useGetUserLocationsQuery,
  useGetLocationStatsQuery,
  useGetAllLocationStatsQuery,
} = locationApi;