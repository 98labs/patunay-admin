# Database Schema Documentation

## Overview

Patunay Admin uses Supabase (PostgreSQL) as its database backend. The schema has been recently refactored to a single-tenant architecture with improved naming conventions and structure.

## Core Tables

### profiles
Extended user profile information linked to Supabase auth.users.

```sql
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    role user_role_new NOT NULL DEFAULT 'viewer',
    permissions text[] DEFAULT '{}',
    phone text,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);
```

**Indexes:**
- `idx_profiles_email` on (email)
- `idx_profiles_role` on (role)
- `idx_profiles_active` on (is_active)
- `idx_profiles_permissions` on (permissions) using GIN

### artworks
Main table for artwork information and metadata.

```sql
CREATE TABLE public.artworks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_number text UNIQUE NOT NULL,  -- formerly id_number
    title text NOT NULL,
    description text,
    artist text,
    year text,
    medium text,
    height numeric,
    width numeric,
    size_unit text,
    nfc_tag_id text REFERENCES public.nfc_tags(id),  -- formerly tag_id
    provenance text,
    bibliography text[] DEFAULT '{}',
    collectors text[] DEFAULT '{}',
    nfc_scan_count integer DEFAULT 0,  -- formerly readWriteCount
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES auth.users(id)
);
```

**Indexes:**
- `idx_artworks_catalog_number` on (catalog_number)
- `idx_artworks_nfc_tag_id` on (nfc_tag_id)
- `idx_artworks_artist_year` on (artist, year)
- `idx_artworks_created_at_desc` on (created_at DESC)

### nfc_tags (formerly tags)
Registry of NFC tags used for artwork authentication.

```sql
CREATE TABLE public.nfc_tags (
    id text PRIMARY KEY,
    tag_uid text UNIQUE NOT NULL,  -- formerly tag_id
    artwork_id uuid REFERENCES public.artworks(id),
    is_active boolean DEFAULT true,  -- formerly active
    issued_at timestamp with time zone DEFAULT now(),  -- formerly issue_date
    issued_by uuid REFERENCES auth.users(id),  -- formerly tag_issued_by
    expiration_date timestamp with time zone,
    write_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES auth.users(id)
);
```

**Indexes:**
- `idx_nfc_tags_tag_uid` on (tag_uid)
- `idx_nfc_tags_is_active` on (is_active)
- `idx_nfc_tags_artwork_id` on (artwork_id)

### artwork_images (formerly assets)
Images and media files associated with artworks.

```sql
CREATE TABLE public.artwork_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id uuid REFERENCES public.artworks(id) ON DELETE CASCADE,
    url text NOT NULL,
    file_name text,  -- formerly filename
    description text,
    type text,
    display_order integer DEFAULT 0,  -- formerly sort_order
    file_size bigint,
    mime_type text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    uploaded_by uuid REFERENCES auth.users(id)
);
```

**Indexes:**
- `idx_artwork_images_artwork_id` on (artwork_id)
- `idx_artwork_images_display_order` on (artwork_id, display_order)

### artwork_appraisers
Appraisal information for artworks.

```sql
CREATE TABLE public.artwork_appraisers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id uuid REFERENCES public.artworks(id) ON DELETE CASCADE,
    appraiser_name text NOT NULL,
    appraised_value numeric,
    appraisal_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);
```

**Indexes:**
- `idx_artwork_appraisers_artwork_id` on (artwork_id)
- `idx_artwork_appraisers_date` on (appraisal_date)

### user_permissions
Fine-grained permission assignments for users.

```sql
CREATE TABLE public.user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    permission text NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    UNIQUE(user_id, permission)
);
```

**Indexes:**
- `idx_user_permissions_user_active` on (user_id, is_active)

### user_sessions
Active user session tracking.

```sql
CREATE TABLE public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token text UNIQUE NOT NULL,
    ip_address inet,
    user_agent text,
    last_activity timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
```

**Indexes:**
- `idx_user_sessions_user_id` on (user_id)
- `idx_user_sessions_token` on (token)
- `idx_user_sessions_expires` on (expires_at)

## Enums

### user_role_new
User role hierarchy for access control.

```sql
CREATE TYPE user_role_new AS ENUM (
    'admin',      -- Full system access
    'issuer',     -- Can issue artworks and manage NFC tags
    'appraiser',  -- Can create and manage appraisals
    'staff',      -- General staff access
    'viewer'      -- Read-only access
);
```

### size_unit_enum
Standard units for artwork dimensions.

```sql
CREATE TYPE size_unit_enum AS ENUM ('cm', 'inches');
```

## Views

### current_user_profile
Convenience view for accessing current user's profile.

```sql
CREATE VIEW public.current_user_profile AS
SELECT 
    p.*,
    u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();
```

### profiles_view
Extended profile view with user creation date.

```sql
CREATE VIEW public.profiles_view AS
SELECT 
    p.*,
    u.email,
    u.created_at as user_created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;
```

### v_artworks_with_primary_image
Artworks with their primary image URL.

```sql
CREATE VIEW public.v_artworks_with_primary_image AS
SELECT 
    a.*,
    ai.url as primary_image_url,
    ai.file_name as primary_image_name
FROM public.artworks a
LEFT JOIN public.artwork_images ai ON a.id = ai.artwork_id AND ai.is_primary = true
WHERE a.deleted_at IS NULL;
```

### v_nfc_tags_with_artwork
NFC tags with associated artwork information.

```sql
CREATE VIEW public.v_nfc_tags_with_artwork AS
SELECT 
    nt.*,
    a.catalog_number,
    a.title as artwork_title,
    a.artist as artwork_artist
FROM public.nfc_tags nt
LEFT JOIN public.artworks a ON nt.id = a.nfc_tag_id
WHERE nt.deleted_at IS NULL;
```

## Functions

### has_permission(check_permission text)
Check if current user has a specific permission.

```sql
CREATE FUNCTION public.has_permission(check_permission text)
RETURNS boolean AS $$
-- Implementation checks user role and user_permissions table
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### get_user_role(user_id uuid)
Get the role of a specific user.

```sql
CREATE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role_new AS $$
-- Returns user's role from profiles table
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### add_artwork(...)
Create a new artwork with associated data.

```sql
CREATE FUNCTION public.add_artwork(
    p_idnumber text,
    p_title text,
    p_description text DEFAULT NULL,
    -- ... other parameters
) RETURNS uuid AS $$
-- Creates artwork record and handles associations
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### update_updated_at_column()
Trigger function to automatically update timestamps.

```sql
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Row Level Security (RLS)

All tables have RLS enabled with policies based on user roles:

### Common Policy Patterns

1. **View Policies**: Most authenticated users can view records
2. **Create Policies**: Based on user role (admin, issuer, staff)
3. **Update Policies**: Based on ownership or admin role
4. **Delete Policies**: Usually restricted to admin role

### Example RLS Policy

```sql
-- Users can view all artworks
CREATE POLICY "Users can view artworks" ON public.artworks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
                AND is_active = true
        )
    );

-- Only authorized users can create artworks
CREATE POLICY "Authorized users can create artworks" ON public.artworks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
                AND role IN ('admin', 'issuer', 'staff')
                AND is_active = true
        )
    );
```

## Storage Buckets

### artifacts
Storage for artwork images and related files.
- Public access enabled
- No file size limit
- All file types allowed

### user-avatars
Storage for user profile pictures.
- Public access enabled
- 5MB file size limit
- Only image files allowed (jpeg, jpg, png, gif, webp)

## Migration History

### Recent Changes (Aug 2025)
1. **Single-tenant conversion**: Removed organization and location tables
2. **Table renaming**: `tags` → `nfc_tags`, `assets` → `artwork_images`
3. **Column standardization**: Consistent naming conventions
4. **Schema improvements**: Added audit columns, soft deletes
5. **Performance optimization**: Better indexes and views

## Best Practices

### Data Integrity
- Use foreign key constraints
- Implement soft deletes (deleted_at)
- Track audit information (created_by, updated_by)
- Use database-level constraints

### Performance
- Create appropriate indexes
- Use materialized views for complex queries
- Optimize query patterns
- Regular VACUUM and ANALYZE

### Security
- Enable RLS on all tables
- Use SECURITY DEFINER functions carefully
- Validate input at multiple levels
- Implement proper access control