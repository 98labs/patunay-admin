-- Fix for update_artwork function
-- The issue: The function triggers a log_artwork_update() function that references a non-existent artwork_update_log table

-- Option 1: Create the missing artwork_update_log table (Recommended)
CREATE TABLE IF NOT EXISTS public.artwork_update_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the log table
ALTER TABLE public.artwork_update_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view logs
CREATE POLICY "Authenticated users can view artwork update logs" 
ON public.artwork_update_log 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow system to insert logs
CREATE POLICY "System can insert artwork update logs" 
ON public.artwork_update_log 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Option 2: If you don't want logging, disable the trigger (uncomment below)
-- ALTER TABLE public.artworks DISABLE TRIGGER trigger_log_artwork_update;

-- Option 3: Update the update_artwork function to properly set updated_by
DROP FUNCTION IF EXISTS public.update_artwork CASCADE;

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
    p_bibliography TEXT DEFAULT NULL,
    p_collectors TEXT DEFAULT NULL,
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
        bibliography = COALESCE(p_bibliography::jsonb, bibliography),
        collectors = COALESCE(p_collectors::jsonb, collectors),
        id_number = COALESCE(p_id_number, id_number),
        updated_at = NOW(),
        updated_by = auth.uid() -- Set the updated_by field
    WHERE id = p_artwork_id;

    RETURN QUERY
    SELECT * FROM artworks WHERE id = p_artwork_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_artwork TO authenticated;

-- If you want to check what's in the function that's causing the issue:
-- SELECT prosrc FROM pg_proc WHERE proname = 'log_artwork_update';