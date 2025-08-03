-- Migration: Refactor Database Schema Naming Conventions
-- This migration improves naming consistency and clarity across all tables

-- =====================================================
-- 1. RENAME TABLES TO FOLLOW CONSISTENT NAMING
-- =====================================================

-- Rename tags to nfc_tags for clarity
ALTER TABLE IF EXISTS public.tags RENAME TO nfc_tags;

-- Rename assets to artwork_images for clarity
ALTER TABLE IF EXISTS public.assets RENAME TO artwork_images;

-- =====================================================
-- 2. REFACTOR ARTWORKS TABLE
-- =====================================================

-- Rename columns in artworks table
ALTER TABLE public.artworks 
  RENAME COLUMN id_number TO catalog_number;

ALTER TABLE public.artworks 
  RENAME COLUMN sizeUnit TO size_unit;

ALTER TABLE public.artworks 
  RENAME COLUMN tag_id TO nfc_tag_id;

ALTER TABLE public.artworks 
  RENAME COLUMN expirationDate TO expiration_date;

ALTER TABLE public.artworks 
  RENAME COLUMN readWriteCount TO nfc_scan_count;

-- Add missing audit columns
ALTER TABLE public.artworks 
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

ALTER TABLE public.artworks 
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.artworks 
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- =====================================================
-- 3. REFACTOR NFC_TAGS TABLE (formerly tags)
-- =====================================================

-- Rename columns for consistency
ALTER TABLE public.nfc_tags 
  RENAME COLUMN tag_id TO tag_uid;

ALTER TABLE public.nfc_tags 
  RENAME COLUMN active TO is_active;

ALTER TABLE public.nfc_tags 
  RENAME COLUMN issue_date TO issued_at;

ALTER TABLE public.nfc_tags 
  RENAME COLUMN tag_issued_by TO issued_by;

-- Add missing audit columns
ALTER TABLE public.nfc_tags 
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE public.nfc_tags 
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.nfc_tags 
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- =====================================================
-- 4. REFACTOR ARTWORK_IMAGES TABLE (formerly assets)
-- =====================================================

-- Rename columns for clarity
ALTER TABLE public.artwork_images 
  RENAME COLUMN filename TO file_name;

ALTER TABLE public.artwork_images 
  RENAME COLUMN sort_order TO display_order;

-- Add missing columns
ALTER TABLE public.artwork_images 
  ADD COLUMN IF NOT EXISTS file_size bigint;

ALTER TABLE public.artwork_images 
  ADD COLUMN IF NOT EXISTS mime_type text;

ALTER TABLE public.artwork_images 
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

ALTER TABLE public.artwork_images 
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id);

ALTER TABLE public.artwork_images 
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- =====================================================
-- 5. REFACTOR USER_PERMISSIONS TABLE
-- =====================================================

-- Add missing columns for better tracking
ALTER TABLE public.user_permissions 
  ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.user_permissions 
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

ALTER TABLE public.user_permissions 
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- =====================================================
-- 6. UPDATE FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop old constraint
ALTER TABLE public.artworks 
  DROP CONSTRAINT IF EXISTS artworks_tag_id_fkey;

-- Add new constraint with updated name
ALTER TABLE public.artworks 
  ADD CONSTRAINT artworks_nfc_tag_id_fkey 
  FOREIGN KEY (nfc_tag_id) 
  REFERENCES public.nfc_tags(id) 
  ON DELETE SET NULL;

-- =====================================================
-- 7. UPDATE INDEXES
-- =====================================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_artworks_tag_id;
DROP INDEX IF EXISTS idx_tags_tag_id;
DROP INDEX IF EXISTS idx_tags_active;
DROP INDEX IF EXISTS idx_assets_artwork_id;

-- Create new indexes with better names
CREATE INDEX IF NOT EXISTS idx_artworks_nfc_tag_id ON public.artworks(nfc_tag_id);
CREATE INDEX IF NOT EXISTS idx_artworks_catalog_number ON public.artworks(catalog_number);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_tag_uid ON public.nfc_tags(tag_uid);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_is_active ON public.nfc_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_artwork_images_artwork_id ON public.artwork_images(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_images_display_order ON public.artwork_images(artwork_id, display_order);

-- =====================================================
-- 8. CREATE IMPROVED VIEWS
-- =====================================================

-- Create a view for active artworks with their primary image
CREATE OR REPLACE VIEW public.v_artworks_with_primary_image AS
SELECT 
  a.*,
  ai.url as primary_image_url,
  ai.file_name as primary_image_name
FROM public.artworks a
LEFT JOIN public.artwork_images ai ON a.id = ai.artwork_id AND ai.is_primary = true
WHERE a.deleted_at IS NULL;

-- Create a view for NFC tags with their artwork information
CREATE OR REPLACE VIEW public.v_nfc_tags_with_artwork AS
SELECT 
  nt.*,
  a.catalog_number,
  a.title as artwork_title,
  a.artist as artwork_artist
FROM public.nfc_tags nt
LEFT JOIN public.artworks a ON nt.id = a.nfc_tag_id
WHERE nt.deleted_at IS NULL;

-- =====================================================
-- 9. UPDATE RLS POLICIES
-- =====================================================

-- Update policies to use new table names
DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;
CREATE POLICY "Authenticated users can view artwork images" ON public.artwork_images
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.tags;
CREATE POLICY "Authenticated users can view nfc tags" ON public.nfc_tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 10. ADD HELPFUL COMMENTS
-- =====================================================

-- Add table comments
COMMENT ON TABLE public.artworks IS 'Main table storing artwork information and metadata';
COMMENT ON TABLE public.nfc_tags IS 'NFC tag registry for artwork authentication';
COMMENT ON TABLE public.artwork_images IS 'Image files associated with artworks';
COMMENT ON TABLE public.profiles IS 'User profile information extending auth.users';
COMMENT ON TABLE public.user_permissions IS 'Fine-grained permission assignments for users';

-- Add column comments
COMMENT ON COLUMN public.artworks.catalog_number IS 'Unique catalog/inventory number for the artwork';
COMMENT ON COLUMN public.artworks.nfc_scan_count IS 'Number of times the NFC tag has been scanned';
COMMENT ON COLUMN public.nfc_tags.tag_uid IS 'Unique identifier from the physical NFC tag';
COMMENT ON COLUMN public.nfc_tags.write_count IS 'Number of times data has been written to this tag';

-- =====================================================
-- 11. CREATE AUDIT TRIGGER FUNCTION
-- =====================================================

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables with updated_at column
CREATE TRIGGER update_artworks_updated_at BEFORE UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfc_tags_updated_at BEFORE UPDATE ON public.nfc_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artwork_images_updated_at BEFORE UPDATE ON public.artwork_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 12. DATA MIGRATION FOR EXISTING RECORDS
-- =====================================================

-- Set is_primary for the first image of each artwork (if not already set)
UPDATE public.artwork_images ai
SET is_primary = true
WHERE ai.id IN (
  SELECT DISTINCT ON (artwork_id) id
  FROM public.artwork_images
  WHERE artwork_id IS NOT NULL
  ORDER BY artwork_id, display_order, created_at
)
AND NOT EXISTS (
  SELECT 1 FROM public.artwork_images ai2 
  WHERE ai2.artwork_id = ai.artwork_id 
  AND ai2.is_primary = true
);

-- =====================================================
-- 13. CREATE NEW INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_artworks_artist_year ON public.artworks(artist, year);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at_desc ON public.artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_active ON public.user_permissions(user_id, is_active);

-- Add GIN index for permissions array in profiles
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON public.profiles USING GIN(permissions);

-- =====================================================
-- 14. FINAL CLEANUP
-- =====================================================

-- Analyze tables to update statistics
ANALYZE public.artworks;
ANALYZE public.nfc_tags;
ANALYZE public.artwork_images;
ANALYZE public.profiles;
ANALYZE public.user_permissions;