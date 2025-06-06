-- Fix for get_artwork infinite recursion issue
-- The problem is that the function tries to access profiles table which has RLS policies
-- that may create circular dependencies

-- First, let's create a simpler version that avoids the recursion
CREATE OR REPLACE FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") 
RETURNS TABLE(
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
    "created_by" "uuid",  -- Return UUID instead of name
    "tag_id" "text", 
    "tag_issued_by" "uuid",  -- Return UUID instead of name
    "tag_issued_at" timestamp without time zone, 
    "active" boolean, 
    "created_at" timestamp without time zone, 
    "assets" "jsonb", 
    "provenance" "text", 
    "bibliography" "jsonb", 
    "collector" "text", 
    "collectors" "jsonb", 
    "condition" character varying, 
    "cost" numeric, 
    "bibliographies" "jsonb", 
    "artwork_collectors" "jsonb", 
    "artwork_appraisals" "jsonb"
)
LANGUAGE "plpgsql"
SECURITY DEFINER  -- This allows the function to bypass RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.idnumber,
        a.title,
        a.description,
        a.height,
        a.width,
        a.size_unit,
        a.artist,
        a.year,
        a.medium,
        a.created_by,  -- Just return the UUID
        a.tag_id,
        a.tag_issued_by,  -- Just return the UUID
        a.tag_issued_at,
        t.active,
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
        a.collector,
        a.collectors,
        a.condition,
        a.cost,
        COALESCE(
            (SELECT jsonb_agg(DISTINCT b.*) 
             FROM bibliographies b 
             WHERE b.artwork_id = a.id), 
            '[]'::jsonb
        ) as bibliographies,
        COALESCE(
            (SELECT jsonb_agg(DISTINCT c.*) 
             FROM artwork_collectors c 
             WHERE c.artwork_id = a.id), 
            '[]'::jsonb
        ) as artwork_collectors,
        COALESCE(
            (SELECT jsonb_agg(DISTINCT 
                jsonb_build_object(
                    'id', ap.id,
                    'valuation', ap.valuation,
                    'status', ap.status,
                    'created_at', ap.created_at,
                    'updated_at', ap.updated_at,
                    'collector_id', ap.collector_id,
                    'appraiser_id', ap.appraiser_id,
                    'collection_id', ap.collection_id,
                    'currency', ap.currency,
                    'remarks', ap.remarks,
                    'appraisal_references', ap.appraisal_references
                )
             ) 
             FROM appraisals ap 
             WHERE ap.artwork_id = a.id), 
            '[]'::jsonb
        ) as artwork_appraisals
    FROM artworks a
    LEFT JOIN tags t ON a.tag_id = t.id
    WHERE a.id = p_artwork_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION "public"."get_artwork"("uuid") TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_artwork"("uuid") TO anon;