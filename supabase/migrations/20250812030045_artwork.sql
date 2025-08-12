create table public.artworks (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text not null,
  height double precision null,
  width double precision null,
  size_unit text null,
  artist text not null,
  year text not null,
  medium text null,
  created_by uuid null default auth.uid (),
  tag_id text null,
  tag_issued_by uuid null default auth.uid (),
  tag_issued_at timestamp without time zone null,
  created_at timestamp without time zone null default (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp without time zone null,
  id_number text null,
  provenance text null,
  bibliography jsonb null default '[]'::jsonb,
  collectors jsonb null default '[]'::jsonb,
  updated_by uuid null,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  read_write_count bigint null,
  location_id uuid null,
  constraint artworks_pkey primary key (id),
  constraint artworks_tag_id_key unique (tag_id),
  constraint artworks_location_id_fkey foreign KEY (location_id) references locations (id) on delete set null,
  constraint artworks_owner_id_fkey foreign KEY (created_by) references auth.users (id) on update CASCADE on delete RESTRICT,
  constraint artworks_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint artworks_tag_id_fkey foreign KEY (tag_id) references tags (id) on update CASCADE on delete RESTRICT,
  constraint artworks_tag_issued_by_fkey foreign KEY (tag_issued_by) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_artworks_location_id on public.artworks using btree (location_id) TABLESPACE pg_default;

create trigger trigger_log_artwork_update BEFORE
update on artworks for EACH row
execute FUNCTION log_artwork_update ();

create trigger trigger_set_deleted_fields BEFORE
update on artworks for EACH row when (
  old.deleted_at is null
  and new.deleted_at is not null
)
execute FUNCTION set_deleted_fields ();

create trigger trigger_set_updated_by BEFORE
update on artworks for EACH row
execute FUNCTION set_updated_by ();

create table public.assets (
  id uuid not null default gen_random_uuid (),
  artwork_id uuid null,
  filename text null,
  url text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null,
  sort_order bigint null default '0'::bigint,
  constraint assets_pkey primary key (id),
  constraint assets_artwork_id_fkey foreign KEY (artwork_id) references artworks (id)
) TABLESPACE pg_default;

-- DROP FUNCTION add_artwork;
CREATE OR REPLACE FUNCTION public.add_artwork(
    p_title text,
    p_artist text,
    p_year text,
    p_id_number text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_height double precision DEFAULT NULL,
    p_width double precision DEFAULT NULL,
    p_size_unit text DEFAULT NULL,
    p_medium text DEFAULT NULL,
    p_tag_id text DEFAULT NULL,
    p_provenance text DEFAULT NULL,
    p_bibliography jsonb DEFAULT '[]'::jsonb,
    p_collectors jsonb DEFAULT '[]'::jsonb,
    p_assets jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(
    artwork_id uuid,
    artwork_id_number text,
    artwork_title text,
    artwork_description text,
    artwork_height double precision,
    artwork_width double precision,
    artwork_size_unit text,
    artwork_artist text,
    artwork_year text,
    artwork_medium text,
    artwork_tag_id text,
    artwork_tag_issued_by uuid,
    artwork_tag_issued_at timestamp without time zone,
    artwork_created_at timestamp without time zone,
    artwork_updated_at timestamp without time zone,
    artwork_created_by uuid,
    artwork_updated_by uuid,
    artwork_provenance text,
    artwork_bibliography jsonb,
    artwork_collectors jsonb,
    artwork_location_id uuid,
    artwork_read_write_count bigint,
    artwork_assets jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_artwork_id uuid;
    v_user_id uuid;
    v_user_role user_role_new;
    v_tag_exists boolean := false;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check if user exists and get their role
    SELECT role INTO v_user_role
    FROM public.profiles
    WHERE id = v_user_id AND is_active = true;
    
    -- Check permissions - allow super_user, admin, issuer, staff
    IF v_user_role NOT IN ('super_user', 'admin', 'issuer', 'staff') THEN
        RAISE EXCEPTION 'Insufficient permissions to create artwork. Required role: admin, issuer, or staff';
    END IF;
    
    -- Validate required fields
    IF p_title IS NULL OR trim(p_title) = '' THEN
        RAISE EXCEPTION 'Title is required';
    END IF;
    
    IF p_artist IS NULL OR trim(p_artist) = '' THEN
        RAISE EXCEPTION 'Artist is required';
    END IF;
    
    IF p_year IS NULL OR trim(p_year) = '' THEN
        RAISE EXCEPTION 'Year is required';
    END IF;
    
    -- Check if tag_id already exists and is associated with another artwork
    IF p_tag_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.artworks 
            WHERE tag_id = p_tag_id AND deleted_at IS NULL
        ) INTO v_tag_exists;
        
        IF v_tag_exists THEN
            RAISE EXCEPTION 'Tag ID % is already associated with another artwork', p_tag_id;
        END IF;
        
        -- Check if tag exists in tags table, if not create it
        IF NOT EXISTS(SELECT 1 FROM public.tags WHERE id = p_tag_id) THEN
            INSERT INTO public.tags (
                id,
                active,
                created_by,
                created_at,
                read_write_count
            ) VALUES (
                p_tag_id,
                true,
                v_user_id,
                now(),
                0
            );
        END IF;
    END IF;
    
    -- Insert artwork
    INSERT INTO public.artworks (
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
        tag_issued_by,
        tag_issued_at,
        provenance,
        bibliography,
        collectors,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        p_id_number,
        p_title,
        p_description,
        p_height,
        p_width,
        p_size_unit,
        p_artist,
        p_year,
        p_medium,
        p_tag_id,
        CASE WHEN p_tag_id IS NOT NULL THEN v_user_id ELSE NULL END,
        CASE WHEN p_tag_id IS NOT NULL THEN now() ELSE NULL END,
        p_provenance,
        p_bibliography,
        p_collectors,
        v_user_id,
        v_user_id,
        now(),
        now()
    ) RETURNING artworks.id INTO v_artwork_id;
    
    -- Handle assets if provided
    IF p_assets IS NOT NULL AND jsonb_array_length(p_assets) > 0 THEN
        INSERT INTO public.assets (
            artwork_id,
            filename,
            url,
            sort_order,
            created_at,
            updated_at
        )
        SELECT 
            v_artwork_id,
            (asset->>'filename')::text,
            (asset->>'url')::text,
            COALESCE((asset->>'sortOrder')::bigint, 0),
            now(),
            now()
        FROM jsonb_array_elements(p_assets) AS asset;
    END IF;
    
    -- Return the created artwork with assets
    RETURN QUERY
    SELECT 
        a.id AS artwork_id,
        a.id_number AS artwork_id_number,
        a.title AS artwork_title,
        a.description AS artwork_description,
        a.height AS artwork_height,
        a.width AS artwork_width,
        a.size_unit AS artwork_size_unit,
        a.artist AS artwork_artist,
        a.year AS artwork_year,
        a.medium AS artwork_medium,
        a.tag_id AS artwork_tag_id,
        a.tag_issued_by AS artwork_tag_issued_by,
        a.tag_issued_at AS artwork_tag_issued_at,
        a.created_at AS artwork_created_at,
        a.updated_at AS artwork_updated_at,
        a.created_by AS artwork_created_by,
        a.updated_by AS artwork_updated_by,
        a.provenance AS artwork_provenance,
        a.bibliography AS artwork_bibliography,
        a.collectors AS artwork_collectors,
        a.location_id AS artwork_location_id,
        a.read_write_count AS artwork_read_write_count,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'filename', ast.filename,
                        'url', ast.url,
                        'sortOrder', ast.sort_order
                    ) ORDER BY ast.sort_order
                )
                FROM public.assets ast
                WHERE ast.artwork_id = a.id
            ),
            '[]'::jsonb
        ) AS artwork_assets
    FROM public.artworks a
    WHERE a.id = v_artwork_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_artwork(
    text, text, text, text, text, double precision, double precision, text, 
    text, text, text, jsonb, jsonb, jsonb
) TO authenticated;