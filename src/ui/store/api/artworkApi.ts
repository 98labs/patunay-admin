import { api } from './baseApi';
import { addArtwork as addArtworkRpc } from '../../supabase/rpc/addArtwork';
import { deleteArtwork as deleteArtworkRpc } from '../../supabase/rpc/deleteArtwork';
import { getArtwork as getArtworkRpc } from '../../supabase/rpc/getArtwork';
import { updateArtwork as updateArtworkRpc } from '../../supabase/rpc/updateArtwork';
import { upsertAppraisal } from '../../supabase/rpc/upsertAppraisal';
import type { ArtworkEntity } from '../../typings';
import supabase from '../../supabase';

// Define the API response types
export interface ArtworkListResponse {
  data: ArtworkEntity[];
  count: number;
  error?: string;
}

export interface ArtworkResponse {
  data: ArtworkEntity | null;
  error?: string;
}

export interface CreateArtworkRequest {
  artwork: Partial<ArtworkEntity>;
}

export interface UpdateArtworkRequest {
  id: string;
  updates: Partial<ArtworkEntity>;
}

export interface DeleteArtworkRequest {
  id: string;
}

export interface ArtworkFilters {
  search?: string;
  artist?: string;
  status?: string;
  hasNfcTag?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface ArtworkListRequest {
  page?: number;
  pageSize?: number;
  filters?: ArtworkFilters;
  sortBy?: 'created_at' | 'title' | 'artist' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface AppraisalRequest {
  artworkId: string;
  appraisal: {
    appraiser_name: string;
    appraisal_date: string;
    current_value: number;
    currency: string;
    notes?: string;
  };
}

// Inject endpoints into the main API
export const artworkApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all artworks with filtering and pagination
    getArtworks: builder.query<ArtworkListResponse, ArtworkListRequest>({
      query: ({ page = 1, pageSize = 10, filters = {}, sortBy = 'created_at', sortOrder = 'desc' }) => ({
        supabaseOperation: async () => {
          // Build the query with assets joined
          let query = supabase
            .from('artworks')
            .select('*, assets(*)', { count: 'exact' })
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order(sortBy, { ascending: sortOrder === 'asc' });

          // Apply filters
          if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,artist.ilike.%${filters.search}%`);
          }
          
          if (filters.artist) {
            query = query.eq('artist', filters.artist);
          }
          
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          
          if (filters.hasNfcTag !== undefined) {
            if (filters.hasNfcTag) {
              query = query.not('tag_id', 'is', null);
            } else {
              query = query.is('tag_id', null);
            }
          }
          
          if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
          }
          
          if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
          }

          const { data, error, count } = await query;
          
          if (error) throw error;
          
          return { data: data || [], count: count || 0 };
        }
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Artwork' as const, id })),
              { type: 'Artwork', id: 'LIST' },
            ]
          : [{ type: 'Artwork', id: 'LIST' }],
    }),

    // Get single artwork by ID
    getArtwork: builder.query<ArtworkResponse, string>({
      query: (id) => ({
        supabaseOperation: async () => {
          const result = await getArtworkRpc(id);
          return { data: result };
        }
      }),
      providesTags: (result, error, id) => [{ type: 'Artwork', id }],
    }),

    // Create new artwork
    createArtwork: builder.mutation<ArtworkResponse, CreateArtworkRequest>({
      query: ({ artwork }) => ({
        supabaseOperation: async () => {
          const result = await addArtworkRpc(artwork);
          return { data: result };
        }
      }),
      invalidatesTags: [{ type: 'Artwork', id: 'LIST' }],
    }),

    // Update existing artwork
    updateArtwork: builder.mutation<ArtworkResponse, UpdateArtworkRequest>({
      query: ({ id, updates }) => ({
        supabaseOperation: async () => {
          const result = await updateArtworkRpc({ id, ...updates });
          return { data: result };
        }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Artwork', id },
        { type: 'Artwork', id: 'LIST' },
      ],
    }),

    // Delete artwork
    deleteArtwork: builder.mutation<{ success: boolean }, DeleteArtworkRequest>({
      query: ({ id }) => ({
        supabaseOperation: async () => {
          await deleteArtworkRpc(id);
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Artwork', id },
        { type: 'Artwork', id: 'LIST' },
      ],
    }),

    // Add or update appraisal
    upsertAppraisal: builder.mutation<{ success: boolean }, AppraisalRequest>({
      query: ({ artworkId, appraisal }) => ({
        supabaseOperation: async () => {
          await upsertAppraisal({
            artwork_id: artworkId,
            ...appraisal
          });
          return { success: true };
        }
      }),
      invalidatesTags: (result, error, { artworkId }) => [
        { type: 'Artwork', id: artworkId },
        { type: 'Appraisal', id: 'LIST' },
      ],
    }),

    // Get artwork statistics
    getArtworkStats: builder.query<{
      total: number;
      withNfc: number;
      withoutNfc: number;
      byStatus: Record<string, number>;
      byArtist: Record<string, number>;
    }, void>({
      query: () => ({
        supabaseOperation: async () => {
          const { data: artworks, error } = await supabase
            .from('artworks')
            .select('status, artist, tag_id');

          if (error) throw error;

          const stats = {
            total: artworks?.length || 0,
            withNfc: artworks?.filter(a => a.tag_id).length || 0,
            withoutNfc: artworks?.filter(a => !a.tag_id).length || 0,
            byStatus: {} as Record<string, number>,
            byArtist: {} as Record<string, number>
          };

          // Calculate status distribution
          artworks?.forEach(artwork => {
            if (artwork.status) {
              stats.byStatus[artwork.status] = (stats.byStatus[artwork.status] || 0) + 1;
            }
            if (artwork.artist) {
              stats.byArtist[artwork.artist] = (stats.byArtist[artwork.artist] || 0) + 1;
            }
          });

          return stats;
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'ARTWORK' }],
    }),

    // Search artworks
    searchArtworks: builder.query<ArtworkEntity[], string>({
      query: (searchTerm) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('artworks')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
            .limit(20);

          if (error) throw error;
          return data || [];
        }
      }),
      providesTags: [{ type: 'Artwork', id: 'SEARCH' }],
    }),

    // Search artwork by NFC tag UID using get_artwork RPC
    searchArtworkByNfc: builder.query<ArtworkEntity | null, { uid?: string; data?: string }>({
      query: ({ uid, data }) => ({
        supabaseOperation: async () => {
          // Try multiple approaches to find artwork by NFC UID
          if (uid) {
            console.log('🔍 API: Searching artwork with NFC UID:', uid);
            
            // Approach 1: Try direct UID lookup (might work if database stores raw UIDs)
            try {
              console.log('🔍 API: Trying direct UID lookup with get_artwork RPC');
              const directResult = await supabase.rpc("get_artwork", {
                p_artwork_id: uid,
              });
              
              if (directResult.data && directResult.data.length > 0) {
                console.log('🔍 API: Found artwork with direct UID lookup:', directResult.data[0]);
                return directResult.data[0];
              }
            } catch (error) {
              console.log('🔍 API: Direct UID lookup failed (expected if UID format mismatch):', error);
            }
            
            // Approach 2: Search in artworks table by nfc_uid field or similar
            try {
              console.log('🔍 API: Trying to search artworks by nfc_uid field');
              const nfcSearchResult = await supabase
                .from('artworks')
                .select('*')
                .eq('nfc_uid', uid)
                .single();
              
              if (nfcSearchResult.data) {
                console.log('🔍 API: Found artwork by nfc_uid field:', nfcSearchResult.data);
                return nfcSearchResult.data;
              }
            } catch (error) {
              console.log('🔍 API: NFC UID field search failed:', error);
            }
            
            // Approach 3: Search by any text field that might contain the UID
            try {
              console.log('🔍 API: Trying to search artworks by text fields containing UID');
              const textSearchResult = await supabase
                .from('artworks')
                .select('*')
                .or(`id.eq.${uid},nfc_tag_id.eq.${uid},tag_id.eq.${uid}`)
                .single();
              
              if (textSearchResult.data) {
                console.log('🔍 API: Found artwork by text field search:', textSearchResult.data);
                return textSearchResult.data;
              }
            } catch (error) {
              console.log('🔍 API: Text field search failed:', error);
            }
          }
          
          console.log('🔍 API: No artwork found for NFC UID:', uid);
          return null;
        }
      }),
      providesTags: (result, error, { uid, data }) => [
        { type: 'Artwork', id: `NFC_${uid || data}` }
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetArtworksQuery,
  useGetArtworkQuery,
  useCreateArtworkMutation,
  useUpdateArtworkMutation,
  useDeleteArtworkMutation,
  useUpsertAppraisalMutation,
  useGetArtworkStatsQuery,
  useSearchArtworksQuery,
  useSearchArtworkByNfcQuery,
  useLazyGetArtworksQuery,
  useLazySearchArtworksQuery,
  useLazySearchArtworkByNfcQuery,
} = artworkApi;