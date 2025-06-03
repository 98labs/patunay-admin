-- Fix for update_artwork function to properly handle JSONB bibliography and collectors fields

-- First, let's check the current function definition
\df+ update_artwork

-- Drop the existing function
DROP FUNCTION IF EXISTS public.update_artwork CASCADE;

-- Recreate the function with proper JSONB handling
CREATE OR REPLACE FUNCTION public.update_artwork(
    p_artwork_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_height FLOAT DEFAULT NULL,
    p_width FLOAT DEFAULT NULL,
    p_size_unit TEXT DEFAULT NULL,
    p_artist TEXT DEFAULT NULL,
    p_year TEXT DEFAULT NULL,
    p_medium TEXT DEFAULT NULL,
    p_tag_id TEXT DEFAULT NULL,
    p_expiration_date DATE DEFAULT NULL,
    p_read_write_count INTEGER DEFAULT NULL,
    p_assets JSONB DEFAULT NULL,
    p_provenance TEXT DEFAULT NULL,
    p_bibliography JSONB DEFAULT NULL,  -- Changed from TEXT to JSONB
    p_collectors JSONB DEFAULT NULL,     -- Changed from TEXT to JSONB
    p_id_number TEXT DEFAULT NULL
) RETURNS SETOF artworks AS $$
BEGIN
    UPDATE artworks
    SET 
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        height = COALESCE(p_height, height),
        width = COALESCE(p_width, width),
        size_unit = COALESCE(p_size_unit, size_unit),
        artist = COALESCE(p_artist, artist),
        year = COALESCE(p_year, year),
        medium = COALESCE(p_medium, medium),
        tag_id = COALESCE(p_tag_id, tag_id),
        provenance = COALESCE(p_provenance, provenance),
        bibliography = COALESCE(p_bibliography, bibliography),  -- Direct JSONB assignment
        collectors = COALESCE(p_collectors, collectors),       -- Direct JSONB assignment
        id_number = COALESCE(p_id_number, id_number),
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = p_artwork_id;

    RETURN QUERY
    SELECT * FROM artworks WHERE id = p_artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_artwork TO authenticated;

-- Test the function with JSONB arrays
-- Example test (uncomment to run):
/*
SELECT * FROM update_artwork(
    '00000000-0000-0000-0000-000000000000'::uuid,  -- Replace with actual artwork ID
    p_bibliography := '["Reference 1", "Reference 2"]'::jsonb,
    p_collectors := '["Collector 1", "Collector 2"]'::jsonb
);
*/

-- Alternative: Create a wrapper function that accepts text and converts to JSONB
CREATE OR REPLACE FUNCTION public.update_artwork_text_wrapper(
    p_artwork_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_height FLOAT DEFAULT NULL,
    p_width FLOAT DEFAULT NULL,
    p_size_unit TEXT DEFAULT NULL,
    p_artist TEXT DEFAULT NULL,
    p_year TEXT DEFAULT NULL,
    p_medium TEXT DEFAULT NULL,
    p_tag_id TEXT DEFAULT NULL,
    p_expiration_date DATE DEFAULT NULL,
    p_read_write_count INTEGER DEFAULT NULL,
    p_assets JSONB DEFAULT NULL,
    p_provenance TEXT DEFAULT NULL,
    p_bibliography TEXT DEFAULT NULL,
    p_collectors TEXT DEFAULT NULL,
    p_id_number TEXT DEFAULT NULL
) RETURNS SETOF artworks AS $$
DECLARE
    v_bibliography JSONB;
    v_collectors JSONB;
BEGIN
    -- Convert text to JSONB if provided
    IF p_bibliography IS NOT NULL THEN
        v_bibliography := p_bibliography::jsonb;
    END IF;
    
    IF p_collectors IS NOT NULL THEN
        v_collectors := p_collectors::jsonb;
    END IF;
    
    -- Call the main function with JSONB parameters
    RETURN QUERY
    SELECT * FROM update_artwork(
        p_artwork_id,
        p_title,
        p_description,
        p_height,
        p_width,
        p_size_unit,
        p_artist,
        p_year,
        p_medium,
        p_tag_id,
        p_expiration_date,
        p_read_write_count,
        p_assets,
        p_provenance,
        v_bibliography,
        v_collectors,
        p_id_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_artwork_text_wrapper TO authenticated;