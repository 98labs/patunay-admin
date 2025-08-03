# API Reference

## Overview

Patunay Admin uses RTK Query for API management, providing a robust caching layer and automatic request lifecycle management. All API calls go through Supabase, either as direct REST calls or RPC function invocations.

## Base Configuration

### Base API Setup

```typescript
// src/ui/store/api/baseApi.ts
const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: loggingBaseQuery,
  tagTypes: [
    'Artwork', 'User', 'NfcTag', 'Statistics', 
    'Storage', 'Appraisal', 'Session'
  ],
  endpoints: () => ({}),
});
```

## API Endpoints

### Artwork API

#### Get Artworks
```typescript
getArtworks: build.query<GetArtworksResponse, GetArtworksParams>({
  query: (params) => ({
    url: '/artworks',
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  }),
  providesTags: ['Artwork'],
})
```

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search query
- `sortBy`: Sort field
- `sortOrder`: 'asc' | 'desc'

#### Get Artwork by ID
```typescript
getArtworkById: build.query<Artwork, string>({
  queryFn: async (id) => {
    const result = await getArtwork(id);
    return { data: result };
  },
  providesTags: (result, error, id) => [{ type: 'Artwork', id }],
})
```

#### Create Artwork
```typescript
createArtwork: build.mutation<Artwork, CreateArtworkDto>({
  queryFn: async (data) => {
    const result = await addArtwork(data);
    return { data: result };
  },
  invalidatesTags: ['Artwork', 'Statistics'],
})
```

#### Update Artwork
```typescript
updateArtwork: build.mutation<Artwork, UpdateArtworkDto>({
  queryFn: async ({ id, ...data }) => {
    const result = await updateArtwork(id, data);
    return { data: result };
  },
  invalidatesTags: (result, error, { id }) => [
    { type: 'Artwork', id },
    'Statistics'
  ],
})
```

#### Delete Artwork
```typescript
deleteArtwork: build.mutation<void, string>({
  queryFn: async (id) => {
    await deleteArtwork(id);
    return { data: undefined };
  },
  invalidatesTags: ['Artwork', 'Statistics'],
})
```

### NFC API

#### Get NFC Tags
```typescript
getNfcTags: build.query<NfcTag[], GetNfcTagsParams>({
  queryFn: async (params) => {
    const result = await getTags(params);
    return { data: result };
  },
  providesTags: ['NfcTag'],
})
```

#### Register NFC Tag
```typescript
registerNfcTag: build.mutation<NfcTag, RegisterNfcTagDto>({
  queryFn: async (data) => {
    const result = await registerTag(data);
    return { data: result };
  },
  invalidatesTags: ['NfcTag'],
})
```

#### Attach NFC Tag
```typescript
attachNfcTag: build.mutation<void, AttachNfcTagDto>({
  queryFn: async ({ artworkId, tagId }) => {
    await attachNfcTag(artworkId, tagId);
    return { data: undefined };
  },
  invalidatesTags: ['NfcTag', 'Artwork'],
})
```

#### Detach NFC Tag
```typescript
detachNfcTag: build.mutation<void, string>({
  queryFn: async (artworkId) => {
    await detachNfcTag(artworkId);
    return { data: undefined };
  },
  invalidatesTags: ['NfcTag', 'Artwork'],
})
```

### User Management API

#### Get Users
```typescript
getUsers: build.query<User[], GetUsersParams>({
  query: (params) => ({
    url: '/profiles',
    params,
  }),
  providesTags: ['User'],
})
```

#### Create User
```typescript
createUser: build.mutation<User, CreateUserDto>({
  queryFn: async (data) => {
    const result = await createUserWithProfile(data);
    return { data: result };
  },
  invalidatesTags: ['User'],
})
```

#### Update User
```typescript
updateUser: build.mutation<User, UpdateUserDto>({
  query: ({ id, ...data }) => ({
    url: `/profiles/${id}`,
    method: 'PATCH',
    body: data,
  }),
  invalidatesTags: (result, error, { id }) => [
    { type: 'User', id },
  ],
})
```

#### Update User Role
```typescript
updateUserRole: build.mutation<void, UpdateUserRoleDto>({
  queryFn: async ({ userId, role }) => {
    await updateUserRole(userId, role);
    return { data: undefined };
  },
  invalidatesTags: ['User'],
})
```

### Statistics API

#### Get Dashboard Statistics
```typescript
getDashboardStats: build.query<DashboardStats, void>({
  query: () => '/rpc/get_dashboard_statistics',
  providesTags: ['Statistics'],
})
```

**Response:**
```typescript
interface DashboardStats {
  totalArtworks: number;
  totalUsers: number;
  totalNfcTags: number;
  activeNfcTags: number;
  recentArtworks: Artwork[];
  artworksByMonth: { month: string; count: number }[];
}
```

### Storage API

#### Upload Image
```typescript
uploadImage: build.mutation<UploadResult, UploadImageDto>({
  queryFn: async ({ file, bucket, path }) => {
    const result = await uploadFile(file, bucket, path);
    return { data: result };
  },
  invalidatesTags: ['Storage'],
})
```

#### Delete Image
```typescript
deleteImage: build.mutation<void, DeleteImageDto>({
  queryFn: async ({ bucket, path }) => {
    await deleteFile(bucket, path);
    return { data: undefined };
  },
  invalidatesTags: ['Storage'],
})
```

## Supabase RPC Functions

### add_artwork
Creates a new artwork with associated data.

```typescript
interface AddArtworkParams {
  p_idnumber: string;
  p_title: string;
  p_description?: string;
  p_height?: number;
  p_width?: number;
  p_size_unit?: string;
  p_artist?: string;
  p_year?: string;
  p_medium?: string;
  p_tag_id?: string;
  p_assets?: Array<{
    url: string;
    description: string;
    type: string;
  }>;
  p_provenance?: string;
  p_bibliography?: string[];
  p_collectors?: string[];
}

// Usage
const artworkId = await supabase.rpc('add_artwork', params);
```

### update_artwork
Updates an existing artwork.

```typescript
interface UpdateArtworkParams {
  p_artwork_id: string;
  p_title?: string;
  p_description?: string;
  // ... other optional fields
}

// Usage
await supabase.rpc('update_artwork', params);
```

### get_artwork_enhanced
Retrieves detailed artwork information with related data.

```typescript
interface GetArtworkResponse {
  artwork: Artwork;
  images: ArtworkImage[];
  appraisals: Appraisal[];
  nfcTag?: NfcTag;
}

// Usage
const data = await supabase.rpc('get_artwork_enhanced', { 
  p_artwork_id: artworkId 
});
```

### attach_nfc_to_artwork
Links an NFC tag to an artwork.

```typescript
interface AttachNfcParams {
  p_tag_id: string;
  p_artwork_id: string;
}

// Usage
await supabase.rpc('attach_nfc_to_artwork', params);
```

### detach_nfc_from_artwork
Removes NFC tag association from an artwork.

```typescript
// Usage
await supabase.rpc('detach_nfc_from_artwork', { 
  p_artwork_id: artworkId 
});
```

### create_user_with_profile
Creates a new user with profile information.

```typescript
interface CreateUserParams {
  p_email: string;
  p_password: string;
  p_first_name?: string;
  p_last_name?: string;
  p_role?: UserRole;
  p_phone?: string;
  p_avatar_url?: string;
  p_permissions?: string[];
}

// Usage
const user = await supabase.rpc('create_user_with_profile', params);
```

## Error Handling

All API calls follow a consistent error structure:

```typescript
interface ApiError {
  status: number;
  data: {
    error: string;
    message: string;
    details?: any;
  };
}
```

### Common Error Codes
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Duplicate resource
- `500`: Internal Server Error

## Authentication

All API requests require authentication via Supabase Auth:

```typescript
// Headers automatically included
{
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json',
}
```

## Real-time Subscriptions

### Artwork Updates
```typescript
const subscription = supabase
  .channel('artwork-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'artworks'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### NFC Tag Status
```typescript
const subscription = supabase
  .channel('nfc-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'nfc_tags',
    filter: `is_active=eq.true`
  }, (payload) => {
    // Handle NFC status updates
  })
  .subscribe();
```

## Best Practices

### Caching
- Use RTK Query's built-in caching
- Implement proper cache invalidation
- Use `providesTags` and `invalidatesTags`

### Error Handling
```typescript
try {
  const result = await api.someEndpoint(params).unwrap();
  // Handle success
} catch (error) {
  if (isApiError(error)) {
    // Handle API error
  }
}
```

### Optimistic Updates
```typescript
updateArtwork: build.mutation({
  async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      api.util.updateQueryData('getArtworkById', id, (draft) => {
        Object.assign(draft, patch);
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },
})
```

### Pagination
Always use pagination for list endpoints:
```typescript
const { data, isLoading } = useGetArtworksQuery({
  page: currentPage,
  limit: 20,
  search: searchTerm,
});
```