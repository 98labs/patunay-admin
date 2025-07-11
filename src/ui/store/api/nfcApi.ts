import { api } from './baseApi';
import supabase from '../../supabase';

// NFC types
export interface NfcTag {
  id: string;
  tag_id: string;
  artwork_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  metadata?: Record<string, any>;
}

export interface CreateNfcTagRequest {
  tag_id: string;
  artwork_id?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNfcTagRequest {
  id: string;
  tag_id?: string;
  artwork_id?: string;
  active?: boolean;
  metadata?: Record<string, any>;
}

export interface NfcTagListRequest {
  active?: boolean;
  artwork_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface NfcTagListResponse {
  data: NfcTag[];
  count: number;
  hasMore: boolean;
}

export interface AttachNfcRequest {
  artwork_id: string;
  tag_id: string;
}

export interface DetachNfcRequest {
  tag_id: string;
}

export interface NfcOperationLog {
  id: string;
  tag_id: string;
  operation: 'read' | 'write' | 'attach' | 'detach';
  artwork_id?: string;
  user_id: string;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Inject NFC endpoints
export const nfcApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all NFC tags
    getNfcTags: builder.query<NfcTagListResponse, NfcTagListRequest | void>({
      query: (request = {}) => ({
        supabaseOperation: async () => {
          const { active, artwork_id, search, limit = 50, offset = 0 } = request;
          
          let query = supabase
            .from('tags')
            .select('*, artworks(title, artist)', { count: 'exact' });

          if (active !== undefined) {
            query = query.eq('active', active);
          }

          if (artwork_id) {
            query = query.eq('artwork_id', artwork_id);
          }

          if (search) {
            query = query.or(`tag_id.ilike.%${search}%,artworks.title.ilike.%${search}%`);
          }

          query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          const { data, error, count } = await query;

          if (error) throw error;

          return {
            data: data || [],
            count: count || 0,
            hasMore: (data?.length || 0) === limit,
          };
        }
      }),
      providesTags: (result) => [
        { type: 'NfcTag', id: 'LIST' },
        ...(result?.data.map(({ id }) => ({ type: 'NfcTag' as const, id })) || []),
      ],
    }),

    // Get single NFC tag
    getNfcTag: builder.query<NfcTag, string>({
      query: (id) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('tags')
            .select('*, artworks(*)')
            .eq('id', id)
            .single();

          if (error) throw error;

          return data;
        }
      }),
      providesTags: (result, error, id) => [{ type: 'NfcTag', id }],
    }),

    // Create new NFC tag
    createNfcTag: builder.mutation<NfcTag, CreateNfcTagRequest>({
      query: (newTag) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('tags')
            .insert({
              ...newTag,
              active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;

          return data;
        }
      }),
      invalidatesTags: [{ type: 'NfcTag', id: 'LIST' }],
    }),

    // Update NFC tag
    updateNfcTag: builder.mutation<NfcTag, UpdateNfcTagRequest>({
      query: ({ id, ...updates }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('tags')
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
        { type: 'NfcTag', id },
        { type: 'NfcTag', id: 'LIST' },
      ],
    }),

    // Attach NFC tag to artwork
    attachNfcToArtwork: builder.mutation<{ success: boolean }, AttachNfcRequest>({
      query: ({ artwork_id, tag_id }) => ({
        supabaseOperation: async () => {
          // First, check if tag exists and is available
          const { data: existingTag, error: tagError } = await supabase
            .from('tags')
            .select('id, active, artwork_id')
            .eq('tag_id', tag_id)
            .single();

          if (tagError && tagError.code !== 'PGRST116') {
            throw tagError;
          }

          if (existingTag && existingTag.artwork_id) {
            throw new Error('NFC tag is already attached to another artwork');
          }

          // Update or create the tag
          if (existingTag) {
            const { error: updateError } = await supabase
              .from('tags')
              .update({
                artwork_id,
                active: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingTag.id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('tags')
              .insert({
                tag_id,
                artwork_id,
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) throw insertError;
          }

          // Log the operation
          await supabase.from('nfc_operation_logs').insert({
            tag_id,
            operation: 'attach',
            artwork_id,
            success: true,
            created_at: new Date().toISOString(),
          });

          return { success: true };
        }
      }),
      invalidatesTags: [
        { type: 'NfcTag', id: 'LIST' },
        { type: 'Artwork', id: 'LIST' },
      ],
    }),

    // Detach NFC tag from artwork
    detachNfcFromArtwork: builder.mutation<{ success: boolean }, DetachNfcRequest>({
      query: ({ tag_id }) => ({
        supabaseOperation: async () => {
          const { data: tag, error: findError } = await supabase
            .from('tags')
            .select('id, artwork_id')
            .eq('tag_id', tag_id)
            .single();

          if (findError) throw findError;

          const { error: updateError } = await supabase
            .from('tags')
            .update({
              active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tag.id);

          if (updateError) throw updateError;

          // Log the operation
          await supabase.from('nfc_operation_logs').insert({
            tag_id,
            operation: 'detach',
            artwork_id: tag.artwork_id,
            success: true,
            created_at: new Date().toISOString(),
          });

          return { success: true };
        }
      }),
      invalidatesTags: [
        { type: 'NfcTag', id: 'LIST' },
        { type: 'Artwork', id: 'LIST' },
      ],
    }),

    // Get NFC operation logs
    getNfcOperationLogs: builder.query<NfcOperationLog[], { tag_id?: string; limit?: number; offset?: number }>({
      query: ({ tag_id, limit = 50, offset = 0 }) => ({
        supabaseOperation: async () => {
          let query = supabase
            .from('nfc_operation_logs')
            .select('*, users(email)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (tag_id) {
            query = query.eq('tag_id', tag_id);
          }

          const { data, error } = await query;

          if (error) throw error;

          return data || [];
        }
      }),
      providesTags: [{ type: 'NfcTag', id: 'LOGS' }],
    }),

    // Bulk operations for NFC tags
    bulkUpdateNfcTags: builder.mutation<{ success: boolean; updated: number }, { tag_ids: string[]; updates: Partial<NfcTag> }>({
      query: ({ tag_ids, updates }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase
            .from('tags')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .in('tag_id', tag_ids)
            .select('id');

          if (error) throw error;

          return {
            success: true,
            updated: data?.length || 0,
          };
        }
      }),
      invalidatesTags: [{ type: 'NfcTag', id: 'LIST' }],
    }),
  }),
});

// Export hooks
export const {
  useGetNfcTagsQuery,
  useGetNfcTagQuery,
  useCreateNfcTagMutation,
  useUpdateNfcTagMutation,
  useAttachNfcToArtworkMutation,
  useDetachNfcFromArtworkMutation,
  useGetNfcOperationLogsQuery,
  useBulkUpdateNfcTagsMutation,
  useLazyGetNfcTagsQuery,
  useLazyGetNfcTagQuery,
  useLazyGetNfcOperationLogsQuery,
} = nfcApi;