-- Complete fix for add_artwork function to match the code expectations
-- This migration addresses all column name mismatches and missing fields

-- Drop and recreate the add_artwork function with correct column mappings
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
    "p_collectors" "jsonb" DEFAULT NULL::"jsonb"
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
    "collectors" "jsonb"
)
LANGUAGE "plpgsql"
AS $$
DECLARE
    v_artwork_id UUID;
    v_tag_id TEXT := NULL;
BEGIN
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
                RAISE EXCEPTION 'Artwork with tag_id % already exists.', v_tag_id;
            END IF;
        END IF;
    END IF;

    -- Insert artwork without tag if v_tag_id is NULL
    INSERT INTO artworks (
        id_number, title, description, height, width, size_unit, artist, year, medium, tag_id, tag_issued_at, created_at, provenance, bibliography, collectors
    ) VALUES (
        p_idnumber, p_title, p_description, p_height, p_width, p_size_unit, p_artist, p_year, p_medium, v_tag_id, 
        CASE WHEN v_tag_id IS NOT NULL THEN NOW() ELSE NULL END, 
        NOW(), p_provenance, p_bibliography, p_collectors
    )
    RETURNING artworks.id INTO v_artwork_id;

    -- Insert assets with sort_order based on array index
    IF p_assets IS NOT NULL THEN
        INSERT INTO assets (artwork_id, filename, url, created_at, sort_order)
        SELECT 
            v_artwork_id,
            asset->>'filename',
            asset->>'url',
            NOW(),
            idx
        FROM jsonb_array_elements(p_assets) WITH ORDINALITY AS asset(asset, idx);
    END IF;

    -- Return the newly created artwork along with its assets
    -- FIXED: Removed the collector field from RETURNS TABLE since it's not being selected
    -- FIXED: Return id_number as idnumber to match the expected return type
    RETURN QUERY
    SELECT 
        a.id,
        a.id_number as idnumber,  -- Map id_number to idnumber
        a.title,
        a.description,
        a.height,
        a.width,
        a.size_unit,
        a.artist,
        a.year,
        a.medium,
        COALESCE(
            (SELECT p.first_name || ' ' || p.last_name FROM profiles p WHERE p.id = a.created_by),
            'Unknown User'
        ) AS created_by,
        a.tag_id,
        COALESCE(
            (SELECT p.first_name || ' ' || p.last_name FROM profiles p WHERE p.id = a.tag_issued_by),
            'Unknown User'
        ) AS tag_issued_by,
        a.tag_issued_at,
        a.created_at,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'filename', ass.filename,
                    'url', ass.url,
                    'sort_order', ass.sort_order
                ) ORDER BY ass.sort_order
            )
            FROM assets ass
            WHERE ass.artwork_id = a.id
        ) AS assets,
        a.provenance,
        a.bibliography,
        a.collectors
    FROM artworks a
    WHERE a.id = v_artwork_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An error occurred while adding artwork: %', SQLERRM;
END;
$$;

-- Also fix the bulk_add_artwork function to use id_number instead of idnumber
CREATE OR REPLACE FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") RETURNS "void"
LANGUAGE "plpgsql"
AS $$
BEGIN
  INSERT INTO artworks (
    id_number,  -- Fixed: changed from idnumber to id_number
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
    collectors
  )
  SELECT
    artwork->>'idnumber',  -- Keep this as idnumber since it's from the JSON input
    artwork->>'title',
    artwork->>'description',
    (artwork->>'height')::numeric,
    (artwork->>'width')::numeric,
    artwork->>'size_unit',
    artwork->>'artist',
    artwork->>'year',  -- Fixed: removed ::int cast since year is text
    artwork->>'medium',
    artwork->>'tag_id',
    artwork->>'provenance',
    (artwork->>'bibliography')::jsonb,
    (artwork->>'collectors')::jsonb
  FROM jsonb_array_elements(artworks) AS artwork;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON FUNCTION "public"."add_artwork" TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_add_artwork" TO "authenticated";