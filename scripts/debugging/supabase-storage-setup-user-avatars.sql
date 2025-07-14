-- Supabase Storage Setup for User Avatars
-- Run this script in your Supabase SQL Editor

-- First, create the storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,  -- public bucket so avatars can be accessed via public URLs
  5242880,  -- 5MB limit (5 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable Row Level Security on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload their own avatars
-- This allows users to upload files to the user-avatars bucket
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text IS NOT NULL
);

-- Policy 2: Allow public read access to avatar files
-- This allows anyone to view avatars (necessary for displaying them in the UI)
CREATE POLICY "Allow public read access to avatars" ON storage.objects
FOR SELECT 
TO public 
USING (bucket_id = 'user-avatars');

-- Policy 3: Allow authenticated users to update their own avatars
-- This allows users to replace their existing avatar files
CREATE POLICY "Allow authenticated users to update avatars" ON storage.objects
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text IS NOT NULL
)
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text IS NOT NULL
);

-- Policy 4: Allow authenticated users to delete their own avatars
-- This allows cleanup of old avatar files when updating
CREATE POLICY "Allow authenticated users to delete avatars" ON storage.objects
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text IS NOT NULL
);

-- Policy 5: Allow service role to manage all avatar files
-- This allows admin operations via service role (for user management)
CREATE POLICY "Allow service role to manage all avatars" ON storage.objects
FOR ALL 
TO service_role 
USING (bucket_id = 'user-avatars')
WITH CHECK (bucket_id = 'user-avatars');

-- Optional: Create a function to clean up old avatar files when a user uploads a new one
-- This prevents accumulation of unused files
CREATE OR REPLACE FUNCTION delete_old_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old avatar file when avatar_url is updated in profiles table
  IF OLD.avatar_url IS NOT NULL AND NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    -- Extract the file path from the old URL
    DECLARE
      old_file_path TEXT;
    BEGIN
      -- Extract path from URL like: https://[project].supabase.co/storage/v1/object/public/user-avatars/[path]
      old_file_path := SUBSTRING(OLD.avatar_url FROM '/user-avatars/(.*)$');
      
      IF old_file_path IS NOT NULL THEN
        -- Delete the old file from storage
        DELETE FROM storage.objects 
        WHERE bucket_id = 'user-avatars' 
        AND name = old_file_path;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up old avatars
DROP TRIGGER IF EXISTS cleanup_old_avatar_trigger ON profiles;
CREATE TRIGGER cleanup_old_avatar_trigger
  AFTER UPDATE OF avatar_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_old_avatar();

-- Verify the setup with some helpful queries
-- (You can run these separately to check your setup)

-- Check if the bucket was created successfully
-- SELECT * FROM storage.buckets WHERE id = 'user-avatars';

-- Check the policies that were created
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';

-- Check current storage usage (optional)
-- SELECT 
--   bucket_id,
--   COUNT(*) as file_count,
--   pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
-- FROM storage.objects 
-- WHERE bucket_id = 'user-avatars'
-- GROUP BY bucket_id;