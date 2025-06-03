# Supabase Storage Setup for User Avatars

This document explains how to set up the storage bucket and permissions for user avatar uploads.

## Quick Setup

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase-storage-setup.sql`
3. Click "Run" to execute the script

## What the Script Does

### 1. Creates Storage Bucket
- **Bucket ID**: `user-avatars`
- **Public Access**: Enabled (for displaying avatars)
- **File Size Limit**: 5MB
- **Allowed Types**: JPEG, PNG, GIF, WebP

### 2. Row Level Security Policies

The script creates 5 security policies:

#### For Regular Users (authenticated):
- **Upload**: Users can upload avatar files
- **Update**: Users can replace their existing avatars
- **Delete**: Users can remove their old avatars

#### For Public Access:
- **Read**: Anyone can view avatar images (necessary for displaying them)

#### For Admin Operations (service_role):
- **Full Access**: Service role can manage all avatar files (for user management features)

### 3. Automatic Cleanup
- Creates a trigger that automatically deletes old avatar files when a user uploads a new one
- Prevents storage bloat from unused files

## Security Features

- ✅ Only authenticated users can upload files
- ✅ Public can only read/view avatars (not upload or modify)
- ✅ Service role has full admin access for user management
- ✅ Automatic cleanup of old files
- ✅ File type and size restrictions

## Verification

After running the script, you can verify the setup with these queries:

```sql
-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'user-avatars';

-- Check security policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';

-- Check storage usage (optional)
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects 
WHERE bucket_id = 'user-avatars'
GROUP BY bucket_id;
```

## Manual Setup Alternative

If you prefer to set up manually through the Supabase Dashboard:

1. **Storage → Settings → Create Bucket**
   - Name: `user-avatars`
   - Public: ✅ Enabled
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

2. **Storage → Policies → Create Policy**
   - Create the 5 policies as shown in the SQL script

## Testing

Once setup is complete, you can test the avatar upload functionality:

1. Navigate to `/dashboard/admin/users`
2. Create or edit a user
3. Upload an avatar image
4. Verify the image displays correctly in the user list and detail view

## Troubleshooting

- **Upload fails**: Check that the bucket exists and policies are active
- **Images don't display**: Verify the bucket is public and read policy exists
- **Permission denied**: Ensure user is authenticated and policies are correctly configured
- **File too large**: Check the 5MB limit in bucket settings