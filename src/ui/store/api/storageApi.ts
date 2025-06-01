import { api } from './baseApi';
import supabase from '../../supabase';

// Storage types
export interface UploadFileRequest {
  bucket: string;
  path: string;
  file: File;
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  };
}

export interface UploadFileResponse {
  path: string;
  fullPath: string;
}

export interface GetSignedUrlRequest {
  bucket: string;
  path: string;
  expiresIn?: number;
}

export interface GetSignedUrlResponse {
  signedUrl: string;
  path: string;
}

export interface DeleteFileRequest {
  bucket: string;
  paths: string[];
}

export interface ListFilesRequest {
  bucket: string;
  path?: string;
  limit?: number;
  offset?: number;
}

export interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

// Inject storage endpoints
export const storageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Upload file to storage
    uploadFile: builder.mutation<UploadFileResponse, UploadFileRequest>({
      query: ({ bucket, path, file, options = {} }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, options);

          if (error) throw error;

          return {
            path: data.path,
            fullPath: data.fullPath,
          };
        }
      }),
      invalidatesTags: (result, error, { bucket }) => [
        { type: 'Asset' as const, id: bucket },
      ],
    }),

    // Get signed URL for file
    getSignedUrl: builder.query<GetSignedUrlResponse, GetSignedUrlRequest>({
      query: ({ bucket, path, expiresIn = 3600 }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

          if (error) throw error;

          return {
            signedUrl: data.signedUrl,
            path,
          };
        }
      }),
      providesTags: (result, error, { bucket, path }) => [
        { type: 'Asset' as const, id: `${bucket}-${path}` },
      ],
    }),

    // Get multiple signed URLs
    getSignedUrls: builder.query<GetSignedUrlResponse[], { bucket: string; paths: string[]; expiresIn?: number }>({
      query: ({ bucket, paths, expiresIn = 3600 }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrls(paths, expiresIn);

          if (error) throw error;

          return data.map((item, index) => ({
            signedUrl: item.signedUrl || '',
            path: paths[index],
          }));
        }
      }),
      providesTags: (result, error, { bucket, paths }) => [
        { type: 'Asset' as const, id: bucket },
        ...paths.map(path => ({ type: 'Asset' as const, id: `${bucket}-${path}` })),
      ],
    }),

    // Delete files from storage
    deleteFiles: builder.mutation<{ success: boolean }, DeleteFileRequest>({
      query: ({ bucket, paths }) => ({
        supabaseOperation: async () => {
          const { error } = await supabase.storage
            .from(bucket)
            .remove(paths);

          if (error) throw error;

          return { success: true };
        }
      }),
      invalidatesTags: (result, error, { bucket, paths }) => [
        { type: 'Asset' as const, id: bucket },
        ...paths.map(path => ({ type: 'Asset' as const, id: `${bucket}-${path}` })),
      ],
    }),

    // List files in bucket
    listFiles: builder.query<FileObject[], ListFilesRequest>({
      query: ({ bucket, path = '', limit = 100, offset = 0 }) => ({
        supabaseOperation: async () => {
          const { data, error } = await supabase.storage
            .from(bucket)
            .list(path, {
              limit,
              offset,
            });

          if (error) throw error;

          return data || [];
        }
      }),
      providesTags: (result, error, { bucket }) => [
        { type: 'Asset' as const, id: bucket },
        { type: 'Asset' as const, id: 'LIST' },
      ],
    }),

    // Get public URL for file
    getPublicUrl: builder.query<{ publicUrl: string }, { bucket: string; path: string }>({
      query: ({ bucket, path }) => ({
        supabaseOperation: async () => {
          const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

          return {
            publicUrl: data.publicUrl,
          };
        }
      }),
      providesTags: (result, error, { bucket, path }) => [
        { type: 'Asset' as const, id: `${bucket}-${path}` },
      ],
    }),

    // Upload multiple files
    uploadFiles: builder.mutation<UploadFileResponse[], { bucket: string; files: Array<{ path: string; file: File; options?: any }> }>({
      query: ({ bucket, files }) => ({
        supabaseOperation: async () => {
          const uploadPromises = files.map(async ({ path, file, options = {} }) => {
            const { data, error } = await supabase.storage
              .from(bucket)
              .upload(path, file, options);

            if (error) throw error;

            return {
              path: data.path,
              fullPath: data.fullPath,
            };
          });

          return Promise.all(uploadPromises);
        }
      }),
      invalidatesTags: (result, error, { bucket }) => [
        { type: 'Asset' as const, id: bucket },
      ],
    }),
  }),
});

// Export hooks
export const {
  useUploadFileMutation,
  useGetSignedUrlQuery,
  useGetSignedUrlsQuery,
  useDeleteFilesMutation,
  useListFilesQuery,
  useGetPublicUrlQuery,
  useUploadFilesMutation,
  useLazyGetSignedUrlQuery,
  useLazyGetSignedUrlsQuery,
  useLazyListFilesQuery,
  useLazyGetPublicUrlQuery,
} = storageApi;