-- Migration to fix artifacts bucket configuration for public access
-- This ensures artwork images are accessible via public URLs

-- First, ensure the artifacts bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artifacts',
  'artifacts', 
  true, -- Set to public so getPublicUrl works
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the artifacts bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload artifacts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artifacts');

-- Allow public to view artifacts (since bucket is public)
CREATE POLICY "Public can view artifacts" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'artifacts');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update own artifacts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'artifacts' AND auth.uid()::text = owner::text);

-- Allow authenticated users to delete their own uploads  
CREATE POLICY "Users can delete own artifacts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'artifacts' AND auth.uid()::text = owner::text);

-- Ensure user-avatars bucket is also public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-avatars';

-- Add comment
COMMENT ON TABLE storage.buckets IS 'Storage buckets configured for public access to support permanent URLs';