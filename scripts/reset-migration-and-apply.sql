-- Remove the failed migration from history
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = '20250731143655';

-- Drop all existing add_artwork functions
DO $$ 
DECLARE
    _sql text;
BEGIN
    -- Find and drop all functions named add_artwork in the public schema
    FOR _sql IN 
        SELECT 'DROP FUNCTION IF EXISTS ' || oid::regprocedure || ' CASCADE;' 
        FROM pg_proc 
        WHERE proname = 'add_artwork' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE _sql;
    END LOOP;
END $$;

-- Create the updated function with organization_id parameter
CREATE OR REPLACE FUNCTION "public"."add_artwork"(
    "p_idnumber" "text", 
    "p_title" "text", 
    "p_description" "text", 
    "p_height" double precision, 
    "p_width" double precision, 
    "p_size_unit" "text", 
    "p_artist" "text", 
    "p_year" "text", 
    "p_medium" "text", 
    "p_tag_id" "text" DEFAULT NULL::"text", 
    "p_expiration_date" "date" DEFAULT NULL::"date", 
    "p_read_write_count" bigint DEFAULT 0, 
    "p_assets" "jsonb" DEFAULT NULL::"jsonb", 
    "p_provenance" "text" DEFAULT NULL::"text", 
    "p_bibliography" "jsonb" DEFAULT NULL::"jsonb", 
    "p_collectors" "jsonb" DEFAULT NULL::"jsonb",
    "p_organization_id" "uuid" DEFAULT NULL::"uuid"
) RETURNS TABLE(
    "id" "uuid", 
    "idnumber" "text", 
    "title" "text", 
    "description" "text", 
    "height" double precision, 
    "width" double precision, 
    "size_unit" "text", 
    "artist" "text", 
    "year" "text", 
    "medium" "text", 
    "created_by" "text", 
    "tag_id" "text", 
    "tag_issued_by" "text", 
    "tag_issued_at" timestamp without time zone, 
    "created_at" timestamp without time zone, 
    "assets" "jsonb", 
    "provenance" "text", 
    "bibliography" "jsonb", 
    "collectors" "jsonb",
    "organization_id" "uuid"
)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_artwork_id UUID;
    v_tag_id TEXT := NULL;
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    -- Validate dimensions
    IF p_height <= 0 OR p_width <= 0 THEN
        RAISE EXCEPTION 'Height and width must be positive numbers.';
    END IF;

    -- Process tag only if p_tag_id is provided
    IF p_tag_id IS NOT NULL THEN
        -- Check if tag already exists
        SELECT tags.id INTO v_tag_id
        FROM tags
        WHERE tags.id = p_tag_id;

        -- Add tag if it doesn't exist
        IF NOT FOUND THEN
            v_tag_id := add_tag(
                p_id := p_tag_id,
                p_expiration_date := p_expiration_date,
                p_read_write_count := p_read_write_count
            );
        END IF;

        -- Check if an artwork with the same tag_id already exists
        IF v_tag_id IS NOT NULL THEN
            PERFORM artworks.id
            FROM artworks
            WHERE artworks.tag_id = v_tag_id;

            IF FOUND THEN
                RAISE EXCEPTION 'An artwork with tag_id % already exists.', v_tag_id;
            END IF;
        END IF;
    END IF;

    -- Insert the artwork
    INSERT INTO artworks (
        id_number,
        title,
        description,
        height,
        width,
        size_unit,
        artist,
        year,
        medium,
        tag_id,
        provenance,
        bibliography,
        collectors,
        organization_id,
        created_by,
        updated_by
    ) VALUES (
        p_idnumber,
        p_title,
        p_description,
        p_height,
        p_width,
        p_size_unit,
        p_artist,
        p_year,
        p_medium,
        v_tag_id,
        p_provenance,
        p_bibliography,
        p_collectors,
        p_organization_id,
        v_user_id,
        v_user_id
    ) RETURNING artworks.id INTO v_artwork_id;

    -- Process assets if provided
    IF p_assets IS NOT NULL THEN
        INSERT INTO assets (artwork_id, filename, url, sort_order)
        SELECT 
            v_artwork_id,
            asset->>'fileName',
            asset->>'url',
            (asset->>'sortOrder')::INT
        FROM jsonb_array_elements(p_assets) AS asset;
    END IF;

    -- Return the newly created artwork with joined data
    RETURN QUERY
    SELECT 
        a.id,
        a.id_number AS idnumber,
        a.title,
        a.description,
        a.height,
        a.width,
        a.size_unit,
        a.artist,
        a.year,
        a.medium,
        u.email AS created_by,
        a.tag_id,
        tu.email AS tag_issued_by,
        a.tag_issued_at,
        a.created_at,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'fileName', ast.filename,
                    'url', ast.url,
                    'sortOrder', ast.sort_order
                ) ORDER BY ast.sort_order
            )
            FROM assets ast
            WHERE ast.artwork_id = a.id),
            '[]'::jsonb
        ) AS assets,
        a.provenance,
        a.bibliography,
        a.collectors,
        a.organization_id
    FROM artworks a
    LEFT JOIN auth.users u ON a.created_by = u.id
    LEFT JOIN auth.users tu ON a.tag_issued_by = tu.id
    WHERE a.id = v_artwork_id;
END;
$$;

-- Add comment to document the change
COMMENT ON FUNCTION public.add_artwork IS 'Adds a new artwork with optional NFC tag and organization association. Updated to include organization_id parameter.';

-- Mark the migration as successfully applied
INSERT INTO supabase_migrations.schema_migrations (version, statements, name) 
VALUES ('20250731143655', NULL, '20250731143655_update_add_artwork_organization.sql');