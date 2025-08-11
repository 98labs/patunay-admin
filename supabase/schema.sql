

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "base32";


ALTER SCHEMA "base32" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'Single-tenant Patunay Admin application schema';



CREATE SCHEMA IF NOT EXISTS "totp";


ALTER SCHEMA "totp" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'staff'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_role_new" AS ENUM (
    'super_user',
    'admin',
    'issuer',
    'appraiser',
    'staff',
    'viewer'
);


ALTER TYPE "public"."user_role_new" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."base32_alphabet"("input" integer) RETURNS character
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  alphabet text[] = ARRAY[
    'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '2', '3', '4', '5',
    '6', '7'
  ]::text;
BEGIN
  RETURN alphabet[input+1];
END;
$$;


ALTER FUNCTION "base32"."base32_alphabet"("input" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."base32_alphabet_to_decimal"("input" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  alphabet text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  alpha int;
BEGIN
  alpha = position(input in alphabet) - 1;
  IF (alpha < 0) THEN 
    RETURN '=';
  END IF;
  RETURN alpha::text;
END;
$$;


ALTER FUNCTION "base32"."base32_alphabet_to_decimal"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."base32_alphabet_to_decimal_int"("input" "text") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  alphabet text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  alpha int;
BEGIN
  alpha = position(input in alphabet) - 1;
  RETURN alpha;
END;
$$;


ALTER FUNCTION "base32"."base32_alphabet_to_decimal_int"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."base32_to_decimal"("input" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  i int;
  output text[];
BEGIN
  input = upper(input);
  FOR i IN 1 .. character_length(input) LOOP
    output = array_append(output, base32.base32_alphabet_to_decimal(substring(input from i for 1)));
  END LOOP;
  RETURN output;
END;
$$;


ALTER FUNCTION "base32"."base32_to_decimal"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."binary_to_int"("input" "text") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  buf text;
BEGIN
    buf = 'SELECT B''' || input || '''::int';
    EXECUTE buf INTO i;
    RETURN i;
END;
$$;


ALTER FUNCTION "base32"."binary_to_int"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."decimal_to_chunks"("input" "text"[]) RETURNS "text"[]
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  i int;
  part text;
  output text[];
BEGIN
  FOR i IN 1 .. cardinality(input) LOOP
    part = input[i];
    IF (part = '=') THEN 
      output = array_append(output, 'xxxxx');
    ELSE
      output = array_append(output, right(base32.to_binary(part::int), 5));
    END IF;
  END LOOP;
  RETURN output;
END;
$$;


ALTER FUNCTION "base32"."decimal_to_chunks"("input" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."decode"("input" "text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  i int;
  arr int[];
  output text[];
  len int;
  num int;

  value int = 0;
  index int = 0;
  bits int = 0;
BEGIN
  len = character_length(input);
  IF (len = 0) THEN 
    RETURN '';
  END IF;

  IF (NOT base32.valid(input)) THEN 
    RAISE EXCEPTION 'INVALID_BASE32';
  END IF;

  input = replace(input, '=', '');
  input = upper(input);
  len = character_length(input);
  num = len * 5 / 8;

  select array(select * from generate_series(1,num))
  INTO arr;
  
  FOR i IN 1 .. len LOOP
    value = (value << 5) | base32.base32_alphabet_to_decimal_int(substring(input from i for 1));
    bits = bits + 5;
    IF (bits >= 8) THEN
      arr[index] = base32.zero_fill(value, (bits - 8)) & 255; -- arr[index] = (value >>> (bits - 8)) & 255;
      index = index + 1;
      bits = bits - 8;
    END IF;
  END LOOP;

  len = cardinality(arr);
  FOR i IN 0 .. len-2 LOOP
     output = array_append(output, chr(arr[i]));
  END LOOP;

  RETURN array_to_string(output, '');
END;
$$;


ALTER FUNCTION "base32"."decode"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."encode"("input" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  IF (character_length(input) = 0) THEN 
    RETURN '';
  END IF;

  RETURN
    base32.to_base32(
      base32.to_decimal(
        base32.fill_chunks(
          base32.to_chunks(
            base32.to_groups(
              base32.to_binary(
                base32.to_ascii(
                  input
                )
              )
            )
          )
        )
      )
    );
END;
$$;


ALTER FUNCTION "base32"."encode"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."fill_chunks"("input" "text"[]) RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  output text[];
  chunk text;
  len int = cardinality(input);
BEGIN
  FOR i IN 1 .. len LOOP 
    chunk = input[i];
    IF (chunk ~* '[0-1]+') THEN 
      chunk = replace(chunk, 'x', '0');
    END IF;
    output = array_append(output, chunk);
  END LOOP;
  RETURN output;
END;
$$;


ALTER FUNCTION "base32"."fill_chunks"("input" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."string_nchars"("text", integer) RETURNS "text"[]
    LANGUAGE "sql" IMMUTABLE
    AS $_$
SELECT ARRAY(SELECT substring($1 from n for $2)
  FROM generate_series(1, length($1), $2) n);
$_$;


ALTER FUNCTION "base32"."string_nchars"("text", integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."to_ascii"("input" "text") RETURNS integer[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  output int[];
BEGIN
  FOR i IN 1 .. character_length(input) LOOP
    output = array_append(output, ascii(substring(input from i for 1)));
  END LOOP;
  RETURN output;
END;
$$;


ALTER FUNCTION "base32"."to_ascii"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."to_base32"("input" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  output text[];
  chunk text;
  buf text;
  len int = cardinality(input);
BEGIN
  FOR i IN 1 .. len LOOP 
    chunk = input[i];
    IF (chunk = '=') THEN 
      chunk = '=';
    ELSE
      chunk = base32.base32_alphabet(chunk::int);
    END IF;
    output = array_append(output, chunk);
  END LOOP;
  RETURN array_to_string(output, '');
END;
$$;


ALTER FUNCTION "base32"."to_base32"("input" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."to_binary"("input" integer[]) RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  output text[];
BEGIN
  FOR i IN 1 .. cardinality(input) LOOP
    output = array_append(output, base32.to_binary(input[i]));  
  END LOOP;
  RETURN output;
END;
$$;


ALTER FUNCTION "base32"."to_binary"("input" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."to_binary"("input" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int = 1;
  j int = 0;
  output char[] = ARRAY['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'];
BEGIN
  WHILE i < 256 LOOP 
    output[8-j] = (CASE WHEN (input & i) > 0 THEN '1' ELSE '0' END)::char;
    i = i << 1;
    j = j + 1;
  END LOOP;
  RETURN array_to_string(output, '');
END;
$$;


ALTER FUNCTION "base32"."to_binary"("input" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."to_chunks"("input" "text"[]) RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  output text[];
  str text;
  len int = cardinality(input);
BEGIN
  RETURN base32.string_nchars(array_to_string(input, ''), 5);
END;
$$;


ALTER FUNCTION "base32"."to_chunks"("input" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."to_decimal"("input" "text"[]) RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  output text[];
  chunk text;
  buf text;
  len int = cardinality(input);
BEGIN
  FOR i IN 1 .. len LOOP 
    chunk = input[i];
    IF (chunk ~* '[x]+') THEN 
      chunk = '=';
    ELSE
      chunk = base32.binary_to_int(input[i])::text;
    END IF;
    output = array_append(output, chunk);
  END LOOP;
  RETURN output;
END;
$$;


ALTER FUNCTION "base32"."to_decimal"("input" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."to_groups"("input" "text"[]) RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  i int;
  output text[];
  len int = cardinality(input);
BEGIN
  IF ( len % 5 = 0 ) THEN 
    RETURN input;
  END IF;
  FOR i IN 1 .. 5 - (len % 5) LOOP
    input = array_append(input, 'xxxxxxxx');
  END LOOP;
  RETURN input;
END;
$$;


ALTER FUNCTION "base32"."to_groups"("input" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."valid"("input" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN 
  IF (upper(input) ~* '^[A-Z2-7]+=*$') THEN 
    RETURN true;
  END IF;
  RETURN false;
END;
$_$;


ALTER FUNCTION "base32"."valid"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "base32"."zero_fill"("a" integer, "b" integer) RETURNS bigint
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  bin text;
  m int;
BEGIN

  IF (b >= 32 OR b < -32) THEN 
    m = b/32;
    b = b-(m*32);
  END IF;

  IF (b < 0) THEN
    b = 32 + b;
  END IF;

  IF (b = 0) THEN
      return ((a>>1)&2147483647)*2::bigint+((a>>b)&1);
  END IF;

  IF (a < 0) THEN
    a = (a >> 1); 
    a = a & 2147483647; -- 0x7fffffff
    a = a | 1073741824; -- 0x40000000
    a = (a >> (b - 1)); 
  ELSE
    a = (a >> b); 
  END IF; 

  RETURN a;
END;
$$;


ALTER FUNCTION "base32"."zero_fill"("a" integer, "b" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text" DEFAULT NULL::"text", "p_height" numeric DEFAULT NULL::numeric, "p_width" numeric DEFAULT NULL::numeric, "p_size_unit" "text" DEFAULT NULL::"text", "p_artist" "text" DEFAULT NULL::"text", "p_year" "text" DEFAULT NULL::"text", "p_medium" "text" DEFAULT NULL::"text", "p_tag_id" "text" DEFAULT NULL::"text", "p_expiration_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_read_write_count" integer DEFAULT NULL::integer, "p_assets" "jsonb" DEFAULT NULL::"jsonb", "p_provenance" "text" DEFAULT NULL::"text", "p_bibliography" "text"[] DEFAULT '{}'::"text"[], "p_collectors" "text"[] DEFAULT '{}'::"text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
  v_artwork_id uuid;
  v_user_id uuid;
  v_user_role user_role_new;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user can create artworks
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id AND is_active = true;
  
  IF v_user_role NOT IN ('super_user', 'admin', 'issuer', 'staff') THEN
    RAISE EXCEPTION 'Insufficient permissions to create artwork';
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
    provenance,
    bibliography,
    collectors,
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
    p_tag_id,
    p_provenance,
    p_bibliography,
    p_collectors,
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_artwork_id;
  
  -- Handle assets if provided
  IF p_assets IS NOT NULL THEN
    INSERT INTO public.assets (artwork_id, url, description, type, created_by)
    SELECT 
      v_artwork_id,
      (asset->>'url')::text,
      (asset->>'description')::text,
      (asset->>'type')::text,
      v_user_id
    FROM jsonb_array_elements(p_assets) AS asset;
  END IF;
  
  -- Update tag if provided
  IF p_tag_id IS NOT NULL THEN
    UPDATE public.tags
    SET 
      artwork_id = v_artwork_id,
      expiration_date = p_expiration_date,
      read_write_count = p_read_write_count,
      updated_at = now(),
      updated_by = v_user_id
    WHERE id = p_tag_id;
  END IF;
  
  RETURN v_artwork_id;
END;$$;


ALTER FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" numeric, "p_width" numeric, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" timestamp with time zone, "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "text"[], "p_collectors" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_artwork_v2"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text" DEFAULT NULL::"text", "p_expiration_date" "date" DEFAULT NULL::"date", "p_read_write_count" bigint DEFAULT 0, "p_assets" "jsonb" DEFAULT NULL::"jsonb", "p_provenance" "text" DEFAULT NULL::"text", "p_bibliography" "jsonb" DEFAULT NULL::"jsonb", "p_collectors" "jsonb" DEFAULT NULL::"jsonb", "p_organization_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "idnumber" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "uuid", "tag_id" "text", "tag_issued_by" "uuid", "tag_issued_at" timestamp without time zone, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collectors" "jsonb", "organization_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
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
    -- Note: returning UUIDs instead of emails to avoid permission issues
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
        a.created_by,
        a.tag_id,
        a.tag_issued_by,
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
    WHERE a.id = v_artwork_id;
END;$$;


ALTER FUNCTION "public"."add_artwork_v2"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_artwork_v2"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_organization_id" "uuid") IS 'Adds a new artwork with optional NFC tag and organization association. Updated to include organization_id parameter and avoid auth.users access.';



CREATE OR REPLACE FUNCTION "public"."add_favorite"("user_id" "uuid", "artwork_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
INSERT INTO favorites (user_id, artwork_id) VALUES (user_id, artwork_id)
ON CONFLICT DO NOTHING;
end;
$$;


ALTER FUNCTION "public"."add_favorite"("user_id" "uuid", "artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint DEFAULT 0, "p_active" boolean DEFAULT true, "p_created_at" timestamp without time zone DEFAULT "now"(), "p_updated_at" timestamp without time zone DEFAULT "now"()) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO tags (
        id,
        read_write_count,
        expiration_date,
        active,
        created_at,
        updated_at
    ) VALUES (
        p_id,
        p_read_write_count,
        p_expiration_date,
        p_active,
        p_created_at,
        p_updated_at
    );

    RETURN p_id;
END;
$$;


ALTER FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_active" boolean, "p_created_at" timestamp without time zone, "p_updated_at" timestamp without time zone) OWNER TO "postgres";


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


ALTER FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_profile_update_permissions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Get current user's role from JWT claims (not from profiles table)
    SELECT current_setting('request.jwt.claims', true)::json->>'role'
    INTO current_user_role;

    -- If the user is not an admin, prevent them from changing certain fields
    IF current_user_role != 'admin' OR current_user_role IS NULL THEN
        -- Check if user is trying to change their own sensitive fields
        IF NEW.id = auth.uid() THEN
            -- Prevent changing own role
            IF NEW.role IS DISTINCT FROM OLD.role THEN
                RAISE EXCEPTION 'You cannot change your own role';
            END IF;
            
            -- Prevent changing own active status
            IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
                RAISE EXCEPTION 'You cannot change your own active status';
            END IF;
        ELSE
            -- Non-admins cannot update other users at all
            -- This should be caught by RLS, but adding as extra security
            RAISE EXCEPTION 'You do not have permission to update other users';
        END IF;
    END IF;

    -- Allow the update to proceed
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_profile_update_permissions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_profile_update_permissions"() IS 'Prevents non-admin users from changing sensitive fields in their profile';



CREATE OR REPLACE FUNCTION "public"."check_user_role"("user_id" "uuid", "check_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role from profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Return true if user has the specified role
  RETURN user_role = check_role;
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs (e.g., user not found), return false
    RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_user_role"("user_id" "uuid", "check_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization_admin_direct"("p_user_id" "uuid", "p_organization_id" "uuid", "p_email" "text", "p_full_name" "text", "p_first_name" "text", "p_last_name" "text", "p_created_by" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- This function assumes the auth user has already been created
  -- It creates the profile and organization membership
  
  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    lower(p_email),
    p_full_name,
    p_first_name,
    p_last_name,
    'admin',
    true,
    now(),
    now()
  )
  RETURNING id INTO v_profile_id;
  
  -- Create organization membership
  INSERT INTO public.organization_users (
    organization_id,
    user_id,
    role,
    is_primary,
    is_active,
    created_at,
    updated_at,
    created_by
  ) VALUES (
    p_organization_id,
    v_profile_id,
    'admin',
    true,
    true,
    now(),
    now(),
    p_created_by
  );
  
  -- Log the action
  INSERT INTO public.user_update_log (
    user_id,
    updated_by,
    action,
    changes,
    created_at
  ) VALUES (
    v_profile_id,
    p_created_by,
    'create_organization_admin',
    jsonb_build_object(
      'organization_id', p_organization_id,
      'role', 'admin',
      'created_by', p_created_by
    ),
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_profile_id,
    'message', 'Organization admin created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback will happen automatically
    RAISE EXCEPTION 'Error creating organization admin profile: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_organization_admin_direct"("p_user_id" "uuid", "p_organization_id" "uuid", "p_email" "text", "p_full_name" "text", "p_first_name" "text", "p_last_name" "text", "p_created_by" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_organization_admin_direct"("p_user_id" "uuid", "p_organization_id" "uuid", "p_email" "text", "p_full_name" "text", "p_first_name" "text", "p_last_name" "text", "p_created_by" "uuid") IS 'Creates profile and organization membership for an admin user. Should only be called from edge functions with service role access.';



CREATE OR REPLACE FUNCTION "public"."create_user"("email" "text", "password" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
  declare
  user_id uuid;
  encrypted_pw text;
BEGIN
  user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', email, encrypted_pw, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), user_id, format('{"sub":"%s","email":"%s"}', user_id::text, email)::jsonb, 'email', now(), now(), now());
END;
$$;


ALTER FUNCTION "public"."create_user"("email" "text", "password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_manually"("user_email" "text", "user_password" "text", "first_name" "text" DEFAULT NULL::"text", "last_name" "text" DEFAULT NULL::"text", "user_role" "text" DEFAULT 'staff'::"text", "user_phone" "text" DEFAULT NULL::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Note: This function creates a user in the profiles table only
    -- The actual auth user must be created through Supabase Auth
    
    -- Generate a UUID for the new user
    new_user_id := gen_random_uuid();
    
    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        role,
        phone,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        first_name,
        last_name,
        user_role,
        user_phone,
        true,
        NOW(),
        NOW()
    );
    
    -- Return the created user info
    result := json_build_object(
        'id', new_user_id,
        'email', user_email,
        'first_name', first_name,
        'last_name', last_name,
        'role', user_role,
        'message', 'Profile created. Use Supabase dashboard to create auth user with this ID: ' || new_user_id::text
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM
        );
END;
$$;


ALTER FUNCTION "public"."create_user_manually"("user_email" "text", "user_password" "text", "first_name" "text", "last_name" "text", "user_role" "text", "user_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profiles"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.user_profiles(id, email)
  VALUES(NEW.id, NEW.email);
END;$$;


ALTER FUNCTION "public"."create_user_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_with_profile"("p_email" "text", "p_password" "text", "p_first_name" "text" DEFAULT NULL::"text", "p_last_name" "text" DEFAULT NULL::"text", "p_role" "public"."user_role_new" DEFAULT 'viewer'::"public"."user_role_new", "p_phone" "text" DEFAULT NULL::"text", "p_avatar_url" "text" DEFAULT NULL::"text", "p_permissions" "text"[] DEFAULT '{}'::"text"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
  v_created_by uuid;
  v_creator_role user_role_new;
BEGIN
  -- Get current user
  v_created_by := auth.uid();
  
  -- Check permissions
  SELECT role INTO v_creator_role
  FROM public.profiles
  WHERE id = v_created_by AND is_active = true;
  
  IF v_creator_role != 'admin' THEN
    RAISE EXCEPTION 'Insufficient permissions to create users';
  END IF;
  
  -- Create auth user
  -- Note: This would typically be done through Supabase Auth API
  -- For now, we'll return a placeholder
  v_user_id := gen_random_uuid();
  
  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    phone,
    avatar_url,
    created_by,
    updated_by
  ) VALUES (
    v_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_role,
    p_phone,
    p_avatar_url,
    v_created_by,
    v_created_by
  );
  
  -- Add permissions if any
  IF array_length(p_permissions, 1) > 0 THEN
    INSERT INTO public.user_permissions (user_id, permission, granted_by)
    SELECT v_user_id, unnest(p_permissions), v_created_by;
  END IF;
  
  RETURN jsonb_build_object(
    'id', v_user_id,
    'email', p_email,
    'role', p_role
  );
END;
$$;


ALTER FUNCTION "public"."create_user_with_profile"("p_email" "text", "p_password" "text", "p_first_name" "text", "p_last_name" "text", "p_role" "public"."user_role_new", "p_phone" "text", "p_avatar_url" "text", "p_permissions" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if the artwork exists
    SELECT EXISTS(SELECT 1 FROM artworks WHERE id = input_artwork_id) INTO v_exists;

    -- If no artwork is found, return a message
    IF NOT v_exists THEN
        RETURN 'No artwork found with the given ID.';
    END IF;

    -- Delete all assets associated with the artwork_id
    DELETE FROM assets
    WHERE artwork_id = input_artwork_id;

    -- Delete the artwork itself
    DELETE FROM artworks
    WHERE id = input_artwork_id;

    -- Return a success message
    RETURN 'Artwork and associated assets deleted successfully.';
END;
$$;


ALTER FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_old_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  -- Delete old avatar file when avatar_url is updated in profiles table
  IF OLD.avatar_url IS NOT NULL AND NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    -- Extract the file path from the old URL
    DECLARE
      old_file_path TEXT;
    BEGIN
      -- Extract path from URL like: https://[project].supabase.co/storage/v1/object/public/artifacts/[path]
      old_file_path := SUBSTRING(OLD.avatar_url FROM '/artifacts/(.*)$');
      
      IF old_file_path IS NOT NULL THEN
        -- Delete the old file from storage
        DELETE FROM storage.objects 
        WHERE bucket_id = 'artifacts' 
        AND name = old_file_path;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."delete_old_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_cascade"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
    -- Delete from any custom tables that reference the user
    -- (Add more DELETE statements here for other tables as needed)
    
    -- Delete user permissions if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_permissions') THEN
        DELETE FROM public.user_permissions WHERE user_id = $1;
    END IF;
    
    -- Delete user sessions if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        DELETE FROM public.user_sessions WHERE user_id = $1;
    END IF;
    
    -- The profile will be deleted automatically due to CASCADE
    -- The auth.users entry will be deleted by Supabase
END;
$_$;


ALTER FUNCTION "public"."delete_user_cascade"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_users_with_roles"() RETURNS TABLE("id" "uuid", "email" "text", "first_name" "text", "last_name" "text", "role" "public"."user_role", "is_active" boolean, "phone" "text", "avatar_url" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "last_login_at" timestamp with time zone, "email_confirmed_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        p.first_name,
        p.last_name,
        COALESCE(p.role, 'staff'::user_role) as role,
        COALESCE(p.is_active, true) as is_active,
        p.phone,
        p.avatar_url,
        p.created_at,
        p.updated_at,
        p.last_login_at,
        au.email_confirmed_at
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.deleted_at IS NULL
    ORDER BY p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_all_users_with_roles"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_users_with_roles"() IS 'Get all users with their roles for admin management';



CREATE OR REPLACE FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") RETURNS TABLE("id" "uuid", "idnumber" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "uuid", "tag_id" "text", "tag_issued_by" "uuid", "tag_issued_at" timestamp without time zone, "active" boolean, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collector" "text", "collectors" "jsonb", "condition" character varying, "cost" numeric, "bibliographies" "jsonb", "artwork_collectors" "jsonb", "artwork_appraisals" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.id_number,
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
        NULL::text AS collector,
        a.collectors,
        NULL::varchar AS condition,
        NULL::numeric AS cost,
        -- COALESCE(
        --     (SELECT jsonb_agg(DISTINCT b.*) 
        --      FROM bibliographies b 
        --      WHERE b.artwork_id = a.id), 
        --     '[]'::jsonb
        -- ) as bibliographies,
        -- COALESCE(
        --     (SELECT jsonb_agg(DISTINCT c.*) 
        --      FROM artwork_collectors c 
        --      WHERE c.artwork_id = a.id), 
        --     '[]'::jsonb
        -- ) as artwork_collectors,
        -- COALESCE(
        --     (SELECT jsonb_agg(DISTINCT 
        --         jsonb_build_object(
        --             'id', ap.id,
        --             'valuation', ap.valuation,
        --             'status', ap.status,
        --             'created_at', ap.created_at,
        --             'updated_at', ap.updated_at,
        --             'collector_id', ap.collector_id,
        --             'appraiser_id', ap.appraiser_id,
        --             'collection_id', ap.collection_id,
        --             'currency', ap.currency,
        --             'remarks', ap.remarks,
        --             'appraisal_references', ap.appraisal_references
        --         )
        --      ) 
        --      FROM appraisals ap 
        --      WHERE ap.artwork_id = a.id), 
        --     '[]'::jsonb
        -- ) as artwork_appraisals
        NULL::jsonb as bibliographies,
        NULL::jsonb as artwork_collectors,
        NULL::jsonb as artwork_appraisals
    FROM artworks a
    LEFT JOIN tags t ON a.tag_id = t.id
    WHERE a.id = p_artwork_id;
END;$$;


ALTER FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_artwork_favorite_count"("p_artwork_id" "uuid") RETURNS integer
    LANGUAGE "sql"
    AS $$ 
  SELECT count(*) FROM favorites WHERE artwork_id = p_artwork_id;
$$;


ALTER FUNCTION "public"."get_artwork_favorite_count"("p_artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_artwork_list"() RETURNS TABLE("id" "uuid", "idnumber" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "text", "tag_id" "text", "tag_issued_by" "text", "tag_issued_at" timestamp without time zone, "active" boolean, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collector" "text", "collectors" "jsonb", "condition" character varying, "cost" numeric)
    LANGUAGE "plpgsql"
    AS $$BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.id_number,
        a.title,
        a.description,
        a.height,
        a.width,
        a.size_unit,
        a.artist,
        a.year,
        a.medium,
        (
            SELECT p.first_name || ' ' || p.last_name AS name
            FROM profiles p
            WHERE p.id = a.created_by
        ) AS created_by,
        a.tag_id,
        (
            SELECT p.first_name || ' ' || p.last_name AS name
            FROM profiles p
            WHERE p.id = a.tag_issued_by
        ) AS tag_issued_by,
        a.tag_issued_at,
        t.active,  -- Retrieved from the `tags` table
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
        NULL::text AS collector,
        a.collectors,
        NULL::varchar AS condition,
        NULL::numeric AS cost
    FROM artworks a
    LEFT JOIN tags t ON t.id = a.tag_id;  -- Join on `tag_id`
END;$$;


ALTER FUNCTION "public"."get_artwork_list"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_image_urls"() RETURNS "text"[]
    LANGUAGE "sql" SECURITY DEFINER
    AS $$ 
SELECT 
array_agg(a.url)
FROM assets a
$$;


ALTER FUNCTION "public"."get_image_urls"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_location_users_with_email"("p_location_id" "uuid") RETURNS TABLE("id" "uuid", "location_id" "uuid", "user_id" "uuid", "organization_id" "uuid", "role" "public"."user_role", "permissions" "text"[], "is_primary_location" boolean, "can_access_other_locations" boolean, "department" "text", "position" "text", "employee_id" "text", "start_date" "date", "end_date" "date", "is_active" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "created_by" "uuid", "deleted_at" timestamp with time zone, "user_email" "text", "user_first_name" "text", "user_last_name" "text", "user_avatar_url" "text", "location_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT 
        lu.id,
        lu.location_id,
        lu.user_id,
        lu.organization_id,
        lu.role,
        lu.permissions,
        lu.is_primary_location,
        lu.can_access_other_locations,
        lu.department,
        lu.position,
        lu.employee_id,
        lu.start_date,
        lu.end_date,
        lu.is_active,
        lu.created_at,
        lu.updated_at,
        lu.created_by,
        lu.deleted_at,
        au.email as user_email,
        p.first_name as user_first_name,
        p.last_name as user_last_name,
        p.avatar_url as user_avatar_url,
        l.name as location_name
    FROM location_users lu
    JOIN profiles p ON p.id = lu.user_id
    JOIN auth.users au ON au.id = lu.user_id
    JOIN locations l ON l.id = lu.location_id
    WHERE lu.location_id = p_location_id
        AND lu.deleted_at IS NULL
        AND p.deleted_at IS NULL
    ORDER BY COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '');
$$;


ALTER FUNCTION "public"."get_location_users_with_email"("p_location_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_location_users_with_email"("p_location_id" "uuid") IS 'Get location users with their profile data and email addresses';



CREATE OR REPLACE FUNCTION "public"."get_organization_users_secure"("p_organization_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "first_name" "text", "last_name" "text", "role" "text", "is_active" boolean, "phone" "text", "avatar_url" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "last_login_at" timestamp with time zone, "permissions" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid;
  v_is_super_user boolean;
  v_has_access boolean;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is super user
  SELECT (role = 'super_user') INTO v_is_super_user
  FROM profiles
  WHERE id = v_user_id;
  
  -- If not super user, check if user belongs to the organization
  IF NOT COALESCE(v_is_super_user, false) THEN
    SELECT EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_id = p_organization_id
      AND user_id = v_user_id
      AND is_active = true
    ) INTO v_has_access;
    
    IF NOT COALESCE(v_has_access, false) THEN
      RAISE EXCEPTION 'Access denied to organization %', p_organization_id;
    END IF;
  END IF;

  -- Return users in the organization
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    ou.role::text,
    p.is_active,
    p.phone,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    COALESCE(ou.permissions, p.permissions, '{}') as permissions
  FROM profiles p
  INNER JOIN organization_users ou ON p.id = ou.user_id
  WHERE ou.organization_id = p_organization_id
  AND ou.is_active = true
  ORDER BY p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_organization_users_secure"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_organization_users_secure"("p_organization_id" "uuid") IS 'Securely get all users in an organization with proper access checks';



CREATE OR REPLACE FUNCTION "public"."get_organization_users_with_email"("p_organization_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "first_name" "text", "last_name" "text", "avatar_url" "text", "role" "public"."user_role_new")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT 
        p.id as user_id,
        au.email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        ou.role
    FROM organization_users ou
    JOIN profiles p ON p.id = ou.user_id
    JOIN auth.users au ON au.id = p.id
    WHERE ou.organization_id = p_organization_id
        AND ou.is_active = true
        AND p.deleted_at IS NULL
        AND au.deleted_at IS NULL
    ORDER BY COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '');
$$;


ALTER FUNCTION "public"."get_organization_users_with_email"("p_organization_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_organization_users_with_email"("p_organization_id" "uuid") IS 'Get organization users with their profile data and email addresses';



CREATE OR REPLACE FUNCTION "public"."get_popular_artworks"() RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "height" integer, "width" integer, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "uuid", "tag_id" "text", "tag_issued_by" "uuid", "tag_issued_at" timestamp without time zone, "created_at" timestamp without time zone, "updated_at" timestamp without time zone, "id_number" "text", "provenance" "text", "bibliography" "jsonb", "collectors" "jsonb", "updated_by" "uuid", "deleted_at" timestamp without time zone, "deleted_by" "uuid", "read_write_count" integer, "location_id" "uuid", "assets" "jsonb")
    LANGUAGE "sql"
    AS $$
SELECT
  a.id,
  a.title,
  a.description,
  a.height,
  a.width,
  a.size_unit,
  a.artist,
  a.year,
  a.medium,
  a.created_by,
  a.tag_id,
  a.tag_issued_by,
  a.tag_issued_at,
  a.created_at,
  a.updated_at,
  a.id_number,
  a.provenance,
  a.bibliography,
  a.collectors,
  a.updated_by,
  a.deleted_at,
  a.deleted_by,
  a.read_write_count,
  a.location_id,
  coalesce(
    (
      select jsonb_agg(assets order by assets.sort_order)
      from assets
      where assets.artwork_id = a.id
    ), '[]'::jsonb
  ) as assets
FROM
  artworks a
LEFT JOIN
  favorites f ON a.id = f.artwork_id
GROUP BY
  a.id,
  a.title,
  a.description,
  a.height,
  a.width,
  a.size_unit,
  a.artist,
  a.year,
  a.medium,
  a.created_by,
  a.tag_id,
  a.tag_issued_by,
  a.tag_issued_at,
  a.created_at,
  a.updated_at,
  a.id_number,
  a.provenance,
  a.bibliography,
  a.collectors,
  a.updated_by,
  a.deleted_at,
  a.deleted_by,
  a.read_write_count,
  a.location_id
ORDER BY
  COUNT(f.artwork_id) DESC;
$$;


ALTER FUNCTION "public"."get_popular_artworks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profiles_with_email"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 10, "p_role" "text" DEFAULT NULL::"text", "p_is_active" boolean DEFAULT NULL::boolean, "p_search" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "name" "text", "role" "text", "is_active" boolean, "created_at" timestamp without time zone, "email" "text", "total_count" integer)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    p.id,
    p.name,
    p.role,
    p.is_active,
    p.created_at,
    u.email,
    count(*) over() as total_count
  from profiles p
  join auth.users u on p.id = u.id
  where (p_role is null or p.role = p_role)
    and (p_is_active is null or p.is_active = p_is_active)
    and (
      p_search is null or
      u.email ilike '%' || p_search || '%' or
      p.name ilike '%' || p_search || '%'
    )
  order by p.created_at desc
  offset (p_page - 1) * p_page_size
  limit p_page_size;
end;
$$;


ALTER FUNCTION "public"."get_profiles_with_email"("p_page" integer, "p_page_size" integer, "p_role" "text", "p_is_active" boolean, "p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_server_datetime"() RETURNS timestamp without time zone
    LANGUAGE "plpgsql"
    AS $$BEGIN
  RETURN NOW() AT TIME ZONE 'UTC';
END;$$;


ALTER FUNCTION "public"."get_server_datetime"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_favorites"("user_id" "uuid") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "height" integer, "width" integer, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "uuid", "tag_id" "text", "tag_issued_by" "uuid", "tag_issued_at" timestamp without time zone, "created_at" timestamp without time zone, "updated_at" timestamp without time zone, "id_number" "text", "provenance" "text", "bibliography" "jsonb", "collectors" "jsonb", "updated_by" "uuid", "deleted_at" timestamp without time zone, "deleted_by" "uuid", "read_write_count" integer, "location_id" "uuid", "assets" "jsonb")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select
    a.id,
    a.title,
    a.description,
    a.height,
    a.width,
    a.size_unit,
    a.artist,
    a.year,
    a.medium,
    a.created_by,
    a.tag_id,
    a.tag_issued_by,
    a.tag_issued_at,
    a.created_at,
    a.updated_at,
    a.id_number,
    a.provenance,
    a.bibliography,
    a.collectors,
    a.updated_by,
    a.deleted_at,
    a.deleted_by,
    a.read_write_count,
    a.location_id,
    coalesce(
      (
        select jsonb_agg(assets order by assets.sort_order)
        from assets
        where assets.artwork_id = a.id
      ), '[]'::jsonb
    ) as assets
  from favorites f
  join artworks a on a.id = f.artwork_id
  where f.user_id = get_user_favorites.user_id
$$;


ALTER FUNCTION "public"."get_user_favorites"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_locations"("p_user_id" "uuid") RETURNS TABLE("location_id" "uuid", "location_name" character varying, "organization_id" "uuid", "organization_name" character varying, "role" "public"."user_role", "is_primary_location" boolean, "can_access_other_locations" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id AS location_id,
        l.name AS location_name,
        o.id AS organization_id,
        o.name AS organization_name,
        lu.role,
        lu.is_primary_location,
        lu.can_access_other_locations
    FROM location_users lu
    JOIN locations l ON l.id = lu.location_id
    JOIN organizations o ON o.id = l.organization_id
    WHERE lu.user_id = p_user_id
    AND lu.is_active = true
    AND l.is_active = true
    AND o.is_active = true
    ORDER BY lu.is_primary_location DESC, l.name;
END;
$$;


ALTER FUNCTION "public"."get_user_locations"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "public"."user_role_new"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role user_role_new;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id AND is_active = true;
  
  RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_with_role"("user_id" "uuid") RETURNS TABLE("id" "uuid", "email" "text", "first_name" "text", "last_name" "text", "role" "public"."user_role", "is_active" boolean, "phone" "text", "avatar_url" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "last_login_at" timestamp with time zone, "permissions" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        p.first_name,
        p.last_name,
        p.role,
        p.is_active,
        p.phone,
        p.avatar_url,
        p.created_at,
        p.updated_at,
        p.last_login_at,
        ARRAY(
            SELECT up.permission 
            FROM user_permissions up 
            WHERE up.user_id = au.id
        ) as permissions
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.id = user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_with_role"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_with_role"("user_id" "uuid") IS 'Get user details with role and permissions';



CREATE OR REPLACE FUNCTION "public"."get_users_in_my_locations"() RETURNS TABLE("id" "uuid", "location_id" "uuid", "user_id" "uuid", "organization_id" "uuid", "role" "public"."user_role", "permissions" "text"[], "is_primary_location" boolean, "can_access_other_locations" boolean, "department" character varying, "position" character varying, "employee_id" character varying, "is_active" boolean, "start_date" "date", "end_date" "date", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "created_by" "uuid", "deleted_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT lu2.*
    FROM location_users lu1
    JOIN location_users lu2 ON lu1.location_id = lu2.location_id
    WHERE lu1.user_id = auth.uid()
    AND lu1.is_active = true
    AND lu2.is_active = true
    AND lu1.deleted_at IS NULL
    AND lu2.deleted_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."get_users_in_my_locations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_user_permission"("target_user_id" "uuid", "permission_name" "text", "granted_by_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    granter_role user_role;
BEGIN
    -- Check if the granter is an admin
    SELECT p.role INTO granter_role
    FROM profiles p
    WHERE p.id = granted_by_user_id;
    
    IF granter_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can grant permissions';
    END IF;
    
    -- Insert or update permission
    INSERT INTO user_permissions (user_id, permission, granted_by, created_at, updated_at)
    VALUES (target_user_id, permission_name, granted_by_user_id, now(), now())
    ON CONFLICT (user_id, permission) 
    DO UPDATE SET 
        granted_by = granted_by_user_id,
        updated_at = now();
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."grant_user_permission"("target_user_id" "uuid", "permission_name" "text", "granted_by_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff')::user_role,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE
    SET updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("check_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role user_role_new;
  has_perm boolean;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
  
  -- Check role-based permissions
  CASE user_role
    WHEN 'admin' THEN
      has_perm := check_permission IN (
        'manage_users', 'manage_artworks', 'manage_nfc_tags', 
        'manage_appraisals', 'view_statistics', 'manage_settings',
        'manage_locations', 'manage_all_users', 'manage_all_artworks',
        'manage_all_nfc_tags', 'view_all_statistics', 'manage_system',
        'manage_all_appraisals', 'manage_all_locations', 'access_all_locations'
      );
    WHEN 'issuer' THEN
      has_perm := check_permission IN (
        'create_artworks', 'manage_nfc_tags', 'attach_nfc_tags', 
        'view_artworks'
      );
    WHEN 'appraiser' THEN
      has_perm := check_permission IN (
        'create_appraisals', 'update_appraisals', 'view_artwork_details',
        'view_artworks'
      );
    WHEN 'staff' THEN
      has_perm := check_permission IN (
        'view_artworks', 'create_artworks', 'update_artworks'
      );
    WHEN 'viewer' THEN
      has_perm := check_permission IN ('view_artworks');
    ELSE
      has_perm := false;
  END CASE;
  
  -- Check additional permissions
  IF NOT has_perm THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid() 
        AND permission = check_permission 
        AND is_active = true
    ) INTO has_perm;
  END IF;
  
  RETURN has_perm;
END;
$$;


ALTER FUNCTION "public"."has_permission"("check_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_in_location"("p_user_id" "uuid", "p_location_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM location_users lu
        WHERE lu.user_id = p_user_id
        AND lu.location_id = p_location_id
        AND lu.is_active = true
        AND lu.deleted_at IS NULL
    );
END;
$$;


ALTER FUNCTION "public"."is_user_in_location"("p_user_id" "uuid", "p_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_artwork_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into artwork_update_log (artwork_id, old_data, updated_by, updated_at)
  values (
    OLD.id,
    to_jsonb(OLD),
    NEW.updated_by,
    now()
  );
  return NEW;
end;
$$;


ALTER FUNCTION "public"."log_artwork_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_status_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RAISE NOTICE 'Trigger: updated_by = %, tag_id = %', NEW.updated_by, NEW.id;
  -- Only insert if the status changed
  IF NEW.active IS DISTINCT FROM OLD.active THEN
    INSERT INTO status_history (tag_id, status, created_by, created_at, updated_at, updated_by, user_id)
    VALUES (
      NEW.id,
      NEW.active,
      NEW.updated_by,
      now(),
      now(),
      NEW.updated_by,
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_status_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_favorite"("user_id" "uuid", "artwork_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  delete from favorites 
  where favorites.user_id = remove_favorite.user_id and favorites.artwork_id = remove_favorite.artwork_id;
end;
$$;


ALTER FUNCTION "public"."remove_favorite"("user_id" "uuid", "artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_user_permission"("target_user_id" "uuid", "permission_name" "text", "revoked_by_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    revoker_role user_role;
BEGIN
    -- Check if the revoker is an admin
    SELECT p.role INTO revoker_role
    FROM profiles p
    WHERE p.id = revoked_by_user_id;
    
    IF revoker_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can revoke permissions';
    END IF;
    
    -- Delete permission
    DELETE FROM user_permissions 
    WHERE user_id = target_user_id AND permission = permission_name;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."revoke_user_permission"("target_user_id" "uuid", "permission_name" "text", "revoked_by_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_delete_user"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Delete related data in order
  DELETE FROM user_permissions WHERE user_id = safe_delete_user.user_id;
  DELETE FROM user_sessions WHERE user_id = safe_delete_user.user_id;
  
  -- Delete profile (this should cascade from auth.users deletion)
  DELETE FROM profiles WHERE id = safe_delete_user.user_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."safe_delete_user"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_artworks"("search" "text") RETURNS TABLE("id" "uuid", "id_number" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "text", "tag_id" "text", "tag_issued_by" "text", "tag_issued_at" timestamp without time zone, "active" boolean, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collector" "text", "collectors" "jsonb", "condition" character varying, "cost" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.id_number,
        a.title,
        a.description,
        a.height,
        a.width,
        a.size_unit,
        a.artist,
        a.year,
        a.medium,
        (
            SELECT p.first_name || ' ' || p.last_name
            FROM profiles p
            WHERE p.id = a.created_by
        ) AS created_by,
        a.tag_id,
        (
            SELECT p.first_name || ' ' || p.last_name
            FROM profiles p
            WHERE p.id = a.tag_issued_by
        ) AS tag_issued_by,
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
        NULL::text AS collector,
        a.collectors,
        NULL::varchar AS condition,
        NULL::numeric AS cost
    FROM artworks a
    LEFT JOIN tags t ON t.id = a.tag_id
    WHERE
        (a.title ILIKE '%' || search || '%' OR a.artist ILIKE '%' || search || '%')
        AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."search_artworks"("search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_deleted_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  NEW.deleted_at := now();
  NEW.deleted_by := auth.uid();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_deleted_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_by"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  NEW.updated_by := auth.uid();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_updated_by"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artworks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "height" double precision,
    "width" double precision,
    "size_unit" "text",
    "artist" "text" NOT NULL,
    "year" "text" NOT NULL,
    "medium" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "tag_id" "text",
    "tag_issued_by" "uuid" DEFAULT "auth"."uid"(),
    "tag_issued_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "updated_at" timestamp without time zone,
    "id_number" "text",
    "provenance" "text",
    "bibliography" "jsonb" DEFAULT '[]'::"jsonb",
    "collectors" "jsonb" DEFAULT '[]'::"jsonb",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "read_write_count" bigint,
    "location_id" "uuid"
);


ALTER TABLE "public"."artworks" OWNER TO "postgres";


COMMENT ON TABLE "public"."artworks" IS 'list of artworks';



CREATE OR REPLACE FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_height" double precision DEFAULT NULL::double precision, "p_width" double precision DEFAULT NULL::double precision, "p_size_unit" "text" DEFAULT NULL::"text", "p_artist" "text" DEFAULT NULL::"text", "p_year" "text" DEFAULT NULL::"text", "p_medium" "text" DEFAULT NULL::"text", "p_tag_id" "text" DEFAULT NULL::"text", "p_expiration_date" "date" DEFAULT NULL::"date", "p_read_write_count" integer DEFAULT NULL::integer, "p_assets" "jsonb" DEFAULT NULL::"jsonb", "p_provenance" "text" DEFAULT NULL::"text", "p_bibliography" "jsonb" DEFAULT NULL::"jsonb", "p_collectors" "jsonb" DEFAULT NULL::"jsonb", "p_id_number" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."artworks"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
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
        read_write_count = p_read_write_count,
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
END;$$;


ALTER FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_id_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_login"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profile"("user_first_name" "text" DEFAULT NULL::"text", "user_last_name" "text" DEFAULT NULL::"text", "user_phone" "text" DEFAULT NULL::"text", "user_avatar_url" "text" DEFAULT NULL::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_user_id UUID;
  updated_profile RECORD;
BEGIN
  -- Get the current user ID from auth context
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Update the user profile (only update non-null values)
  UPDATE profiles 
  SET 
    first_name = COALESCE(user_first_name, first_name),
    last_name = COALESCE(user_last_name, last_name),
    phone = COALESCE(user_phone, phone),
    avatar_url = COALESCE(user_avatar_url, avatar_url),
    updated_at = NOW()
  WHERE id = current_user_id
  RETURNING * INTO updated_profile;
  
  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Return the updated profile as JSON
  RETURN row_to_json(updated_profile);
END;
$$;


ALTER FUNCTION "public"."update_user_profile"("user_first_name" "text", "user_last_name" "text", "user_phone" "text", "user_avatar_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "public"."user_role", "updated_by_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    updater_role user_role;
BEGIN
    -- Check if the updater is an admin
    SELECT p.role INTO updater_role
    FROM profiles p
    WHERE p.id = updated_by_user_id;
    
    IF updater_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;
    
    -- Update the user role
    UPDATE profiles 
    SET 
        role = new_role,
        updated_at = now(),
        updated_by = updated_by_user_id
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "public"."user_role", "updated_by_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_status"("target_user_id" "uuid", "new_status" boolean, "updated_by_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    updater_role user_role;
BEGIN
    -- Check if the updater is an admin
    SELECT p.role INTO updater_role
    FROM profiles p
    WHERE p.id = updated_by_user_id;
    
    IF updater_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update user status';
    END IF;
    
    -- Update the user status
    UPDATE profiles 
    SET 
        is_active = new_status,
        updated_at = now(),
        updated_by = updated_by_user_id
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_user_status"("target_user_id" "uuid", "new_status" boolean, "updated_by_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_can_access_artwork"("p_user_id" "uuid", "p_artwork_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_artwork_location_id UUID;
    v_artwork_org_id UUID;
BEGIN
    -- Get artwork's location and organization
    SELECT location_id, organization_id INTO v_artwork_location_id, v_artwork_org_id
    FROM artworks
    WHERE id = p_artwork_id;
    
    -- If artwork has a location, check location access
    IF v_artwork_location_id IS NOT NULL THEN
        RETURN user_has_location_access(p_user_id, v_artwork_location_id);
    END IF;
    
    -- Otherwise, check organization access
    RETURN EXISTS (
        SELECT 1
        FROM organization_users ou
        WHERE ou.user_id = p_user_id
        AND ou.organization_id = v_artwork_org_id
        AND ou.is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."user_can_access_artwork"("p_user_id" "uuid", "p_artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_can_access_location"("p_location_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_has_access BOOLEAN;
    v_org_id UUID;
BEGIN
    -- Get the organization_id for this location
    SELECT organization_id INTO v_org_id
    FROM locations
    WHERE id = p_location_id;
    
    -- Check if user is super admin
    IF EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'super_user'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is org admin or has org-wide location permissions
    IF EXISTS (
        SELECT 1 FROM organization_users ou
        WHERE ou.user_id = auth.uid()
        AND ou.organization_id = v_org_id
        AND ou.is_active = true
        AND (
            ou.role = 'admin'
            OR ou.permissions && ARRAY['view_all_locations', 'manage_locations']
        )
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is assigned to this specific location
    IF EXISTS (
        SELECT 1 FROM location_users lu
        WHERE lu.user_id = auth.uid()
        AND lu.location_id = p_location_id
        AND lu.is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is the location manager
    IF EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = p_location_id
        AND l.manager_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."user_can_access_location"("p_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_location_access"("p_user_id" "uuid", "p_location_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM location_users lu
        WHERE lu.user_id = p_user_id
        AND lu.location_id = p_location_id
        AND lu.is_active = true
    ) OR EXISTS (
        -- Check if user has org-wide access
        SELECT 1
        FROM locations l
        JOIN organization_users ou ON ou.organization_id = l.organization_id
        WHERE l.id = p_location_id
        AND ou.user_id = p_user_id
        AND ou.is_active = true
        AND (
            ou.role IN ('admin', 'super_user')
            OR ou.permissions && ARRAY['access_all_locations']
        )
    );
END;
$$;


ALTER FUNCTION "public"."user_has_location_access"("p_user_id" "uuid", "p_location_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_otp"("artwork_id" "uuid", "otp_provided" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    secret_plain_text TEXT;
    calculated_totp TEXT;
BEGIN

    SELECT substring(encode(digest(a.tag_id, 'sha256'), 'hex') FROM 1 FOR 20) INTO secret_plain_text
    FROM artworks a
    WHERE a.id = artwork_id 
    LIMIT 1;
    
    IF secret_plain_text IS NULL THEN
        RAISE EXCEPTION 'Artwork not found or secret_plain_text is null for artwork_id %', secret_plain_text;
    END IF;

    calculated_totp := totp.generate(base32.encode(secret_plain_text), 90, 8, get_server_datetime());

    RETURN calculated_totp::INT = otp_provided;
END;
$$;


ALTER FUNCTION "public"."validate_otp"("artwork_id" "uuid", "otp_provided" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."base32_to_hex"("input" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE 
  output text[];
  decoded text = base32.decode(input);
  len int = character_length(decoded);
  hx text;
BEGIN

  FOR i IN 1 .. len LOOP
    hx = to_hex(ascii(substring(decoded from i for 1)))::text;
    IF (character_length(hx) = 1) THEN 
        -- if it is odd number of digits, pad a 0 so it can later 
    		hx = '0' || hx;	
    END IF;
    output = array_append(output, hx);
  END LOOP;

  RETURN array_to_string(output, '');
END;
$$;


ALTER FUNCTION "totp"."base32_to_hex"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."generate"("secret" "text", "period" integer DEFAULT 30, "digits" integer DEFAULT 6, "time_from" timestamp with time zone DEFAULT "now"(), "hash" "text" DEFAULT 'sha1'::"text", "encoding" "text" DEFAULT 'base32'::"text", "clock_offset" integer DEFAULT 0) RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    c int := FLOOR(EXTRACT(EPOCH FROM time_from) / period)::int + clock_offset;
    key bytea;
BEGIN

  IF (encoding = 'base32') THEN 
    key = ( '\x' || totp.base32_to_hex(secret) )::bytea;
  ELSE 
    key = secret::bytea;
  END IF;

  RETURN totp.hotp(key, c, digits, hash);
END;
$$;


ALTER FUNCTION "totp"."generate"("secret" "text", "period" integer, "digits" integer, "time_from" timestamp with time zone, "hash" "text", "encoding" "text", "clock_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."generate_secret"("hash" "text" DEFAULT 'sha1'::"text") RETURNS "bytea"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- See https://tools.ietf.org/html/rfc4868#section-2.1.2
    -- The optimal key length for HMAC is the block size of the algorithm
    CASE
          WHEN hash = 'sha1'   THEN RETURN totp.random_base32(20); -- = 160 bits
          WHEN hash = 'sha256' THEN RETURN totp.random_base32(32); -- = 256 bits
          WHEN hash = 'sha512' THEN RETURN totp.random_base32(64); -- = 512 bits
          ELSE
            RAISE EXCEPTION 'Unsupported hash algorithm for OTP (see RFC6238/4226).';
            RETURN NULL;
    END CASE;
END;
$$;


ALTER FUNCTION "totp"."generate_secret"("hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."hotp"("key" "bytea", "c" integer, "digits" integer DEFAULT 6, "hash" "text" DEFAULT 'sha1'::"text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    c BYTEA := '\x' || LPAD(TO_HEX(c), 16, '0');
    mac BYTEA := HMAC(c, key, hash);
    trunc_offset INT := GET_BYTE(mac, length(mac) - 1) % 16;
    result TEXT := SUBSTRING(SET_BIT(SUBSTRING(mac FROM 1 + trunc_offset FOR 4), 7, 0)::TEXT, 2)::BIT(32)::INT % (10 ^ digits)::INT;
BEGIN
    RETURN LPAD(result, digits, '0');
END;
$$;


ALTER FUNCTION "totp"."hotp"("key" "bytea", "c" integer, "digits" integer, "hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."pad_secret"("input" "bytea", "len" integer) RETURNS "bytea"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE 
  output bytea;
  orig_length int = octet_length(input);
BEGIN
  IF (orig_length = len) THEN 
    RETURN input;
  END IF;

  -- create blank bytea size of new length
  output = lpad('', len, 'x')::bytea;

  FOR i IN 0 .. len-1 LOOP
    output = set_byte(output, i, get_byte(input, i % orig_length));
  END LOOP;

  RETURN output;
END;
$$;


ALTER FUNCTION "totp"."pad_secret"("input" "bytea", "len" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."random_base32"("_length" integer DEFAULT 20) RETURNS "text"
    LANGUAGE "sql"
    AS $$
  SELECT
    string_agg(('{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,2,3,4,5,6,7}'::text[])[ceil(random() * 32)], '')
  FROM
    generate_series(1, _length);
$$;


ALTER FUNCTION "totp"."random_base32"("_length" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."url"("email" "text", "totp_secret" "text", "totp_interval" integer, "totp_issuer" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
  SELECT
    concat('otpauth://totp/', totp.urlencode (email), '?secret=', totp.urlencode (totp_secret), '&period=', totp.urlencode (totp_interval::text), '&issuer=', totp.urlencode (totp_issuer));
$$;


ALTER FUNCTION "totp"."url"("email" "text", "totp_secret" "text", "totp_interval" integer, "totp_issuer" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."urlencode"("in_str" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    AS $$
DECLARE
  _i int4;
  _temp varchar;
  _ascii int4;
  _result text := '';
BEGIN
  FOR _i IN 1..length(in_str)
  LOOP
    _temp := substr(in_str, _i, 1);
    IF _temp ~ '[0-9a-zA-Z:/@._?#-]+' THEN
      _result := _result || _temp;
    ELSE
      _ascii := ascii(_temp);
      IF _ascii > x'07ff'::int4 THEN
        RAISE exception 'won''t deal with 3 (or more) byte sequences.';
      END IF;
      IF _ascii <= x'07f'::int4 THEN
        _temp := '%' || to_hex(_ascii);
      ELSE
        _temp := '%' || to_hex((_ascii & x'03f'::int4) + x'80'::int4);
        _ascii := _ascii >> 6;
        _temp := '%' || to_hex((_ascii & x'01f'::int4) + x'c0'::int4) || _temp;
      END IF;
      _result := _result || upper(_temp);
    END IF;
  END LOOP;
  RETURN _result;
END;
$$;


ALTER FUNCTION "totp"."urlencode"("in_str" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "totp"."verify"("secret" "text", "check_totp" "text", "period" integer DEFAULT 30, "digits" integer DEFAULT 6, "time_from" timestamp with time zone DEFAULT "now"(), "hash" "text" DEFAULT 'sha1'::"text", "encoding" "text" DEFAULT 'base32'::"text", "clock_offset" integer DEFAULT 0) RETURNS boolean
    LANGUAGE "sql"
    AS $$
  SELECT totp.generate (
    secret,
    period,
    digits,
    time_from,
    hash,
    encoding,
    clock_offset) = check_totp;
$$;


ALTER FUNCTION "totp"."verify"("secret" "text", "check_totp" "text", "period" integer, "digits" integer, "time_from" timestamp with time zone, "hash" "text", "encoding" "text", "clock_offset" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appraisal_appraisers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appraisal_id" "uuid",
    "appraiser_id" "uuid",
    "created_at" timestamp without time zone,
    "created_by" "uuid",
    "updated_at" timestamp without time zone,
    "updated_by" "uuid",
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."appraisal_appraisers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artwork_appraisals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "condition" "text",
    "acquisition_cost" numeric,
    "appraised_value" numeric,
    "artist_info" "text",
    "recent_auction_references" "text"[],
    "notes" "text",
    "recommendation" "text",
    "appraisal_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_at" timestamp with time zone,
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "artwork_id" "uuid"
);


ALTER TABLE "public"."artwork_appraisals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artwork_appraisers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "organization" "text",
    "created_by" "uuid",
    "updated_at" timestamp without time zone,
    "updated_by" "uuid",
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."artwork_appraisers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artwork_bibliography" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "artwork_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bibliography_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp without time zone,
    "updated_by" "uuid",
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."artwork_bibliography" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artwork_collectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "artwork_id" "uuid" DEFAULT "gen_random_uuid"(),
    "collector_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_by" "uuid" DEFAULT "gen_random_uuid"(),
    "updated_at" timestamp without time zone,
    "updated_by" "uuid" DEFAULT "gen_random_uuid"(),
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."artwork_collectors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."artwork_stats" AS
 SELECT "count"(*) AS "total_artworks",
    "count"("artworks"."tag_id") AS "artworks_with_nfc",
    ("count"(*) - "count"("artworks"."tag_id")) AS "artworks_without_nfc",
    "count"(
        CASE
            WHEN ("artworks"."created_at" >= (CURRENT_DATE - '7 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "recently_added_week",
    "count"(
        CASE
            WHEN ("artworks"."created_at" >= (CURRENT_DATE - '30 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "recently_added_month",
    "count"(
        CASE
            WHEN ("artworks"."created_at" >= (CURRENT_DATE - '1 day'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "recently_added_today"
   FROM "public"."artworks";


ALTER TABLE "public"."artwork_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artwork_update_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artwork_id" "uuid" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changes" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."artwork_update_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artwork_id" "uuid",
    "filename" "text",
    "url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone,
    "sort_order" bigint DEFAULT '0'::bigint
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bibliography" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "description" character varying,
    "created_by" "uuid" DEFAULT "gen_random_uuid"(),
    "updated_at" timestamp without time zone,
    "updated_by" "uuid" DEFAULT "gen_random_uuid"(),
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."bibliography" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "description" character varying,
    "created_by" "uuid" DEFAULT "gen_random_uuid"(),
    "updated_at" timestamp without time zone,
    "updated_by" "uuid" DEFAULT "gen_random_uuid"(),
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."collectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "is_active" boolean DEFAULT true,
    "phone" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "last_login_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "role" "public"."user_role_new" DEFAULT 'viewer'::"public"."user_role_new" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with RLS policies for user management. Admins can manage all users, users can view/update their own profile.';



COMMENT ON COLUMN "public"."profiles"."role" IS 'User role - admin is the highest role in single-tenant mode';



CREATE OR REPLACE VIEW "public"."current_user_profile" AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."is_active",
    "p"."phone",
    "p"."avatar_url",
    "p"."created_at",
    "p"."updated_at",
    "p"."created_by",
    "p"."updated_by",
    "p"."last_login_at",
    "p"."deleted_at",
    "p"."deleted_by",
    "p"."role",
    "u"."email"
   FROM ("public"."profiles" "p"
     JOIN "auth"."users" "u" ON (("u"."id" = "p"."id")))
  WHERE ("p"."id" = "auth"."uid"());


ALTER TABLE "public"."current_user_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "artwork_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid",
    "location_id" "uuid"
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'staff'::"public"."user_role" NOT NULL,
    "permissions" "text"[] DEFAULT '{}'::"text"[],
    "is_primary_location" boolean DEFAULT false,
    "can_access_other_locations" boolean DEFAULT false,
    "department" character varying(100),
    "position" character varying(100),
    "employee_id" character varying(50),
    "is_active" boolean DEFAULT true,
    "start_date" "date" DEFAULT CURRENT_DATE,
    "end_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."location_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50),
    "description" "text",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "street" character varying(255),
    "city" character varying(100),
    "state" character varying(100),
    "country" character varying(100),
    "postal_code" character varying(20),
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "phone" character varying(50),
    "email" character varying(255),
    "manager_id" "uuid",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "is_headquarters" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "text" NOT NULL,
    "read_write_count" bigint DEFAULT '0'::bigint NOT NULL,
    "expiration_date" "date",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone,
    "updated_by" "uuid",
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."tags" IS 'list of nfc tags';



CREATE OR REPLACE VIEW "public"."nfc_stats" AS
 SELECT "count"(*) AS "total_tags",
    "count"(
        CASE
            WHEN ("tags"."active" = true) THEN 1
            ELSE NULL::integer
        END) AS "active_tags",
    "count"(
        CASE
            WHEN ("tags"."active" = false) THEN 1
            ELSE NULL::integer
        END) AS "inactive_tags",
    "count"(
        CASE
            WHEN ("tags"."created_at" >= (CURRENT_DATE - '7 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "tags_created_week",
    "avg"("tags"."read_write_count") AS "avg_read_write_count",
    "sum"("tags"."read_write_count") AS "total_operations"
   FROM "public"."tags";


ALTER TABLE "public"."nfc_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profiles_view" AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."is_active",
    "p"."phone",
    "p"."avatar_url",
    "p"."created_at",
    "p"."updated_at",
    "p"."created_by",
    "p"."updated_by",
    "p"."last_login_at",
    "p"."deleted_at",
    "p"."deleted_by",
    "p"."role",
    "u"."email",
    "u"."created_at" AS "user_created_at"
   FROM ("public"."profiles" "p"
     JOIN "auth"."users" "u" ON (("u"."id" = "p"."id")));


ALTER TABLE "public"."profiles_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "public"."user_role_new" NOT NULL,
    "permission" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "text" NOT NULL,
    "status" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" DEFAULT "gen_random_uuid"(),
    "updated_at" timestamp without time zone,
    "updated_by" "uuid" DEFAULT "gen_random_uuid"(),
    "deleted_at" timestamp without time zone,
    "deleted_by" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."status_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."system_performance_metrics" AS
 SELECT 'storage'::"text" AS "metric_type",
    2.5 AS "current_value",
    10.0 AS "max_value",
    'GB'::"text" AS "unit",
    25.0 AS "percentage",
    CURRENT_TIMESTAMP AS "last_updated"
UNION ALL
 SELECT 'response_time'::"text" AS "metric_type",
    245.0 AS "current_value",
    1000.0 AS "max_value",
    'ms'::"text" AS "unit",
    24.5 AS "percentage",
    CURRENT_TIMESTAMP AS "last_updated"
UNION ALL
 SELECT 'uptime'::"text" AS "metric_type",
    99.8 AS "current_value",
    100.0 AS "max_value",
    '%'::"text" AS "unit",
    99.8 AS "percentage",
    CURRENT_TIMESTAMP AS "last_updated";


ALTER TABLE "public"."system_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "permission" "text" NOT NULL,
    "granted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_permissions" IS 'User-specific permissions for fine-grained access control';



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_token" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_sessions" IS 'User session tracking for security and analytics';



CREATE OR REPLACE VIEW "public"."user_stats" AS
 SELECT "count"(*) AS "total_users",
    "count"(
        CASE
            WHEN ("users"."last_sign_in_at" IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS "active_users",
    "count"(
        CASE
            WHEN ("users"."last_sign_in_at" IS NULL) THEN 1
            ELSE NULL::integer
        END) AS "inactive_users",
    "count"(
        CASE
            WHEN ("users"."created_at" >= (CURRENT_DATE - '7 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "recent_signups_week",
    "count"(
        CASE
            WHEN ("users"."created_at" >= (CURRENT_DATE - '30 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "recent_signups_month",
    "count"(
        CASE
            WHEN ("users"."last_sign_in_at" >= (CURRENT_DATE - '1 day'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "active_today"
   FROM "auth"."users";


ALTER TABLE "public"."user_stats" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appraisal_appraisers"
    ADD CONSTRAINT "appraisal_appraisers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artwork_appraisers"
    ADD CONSTRAINT "art_appraiser_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artwork_appraisals"
    ADD CONSTRAINT "artwork_appraisals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artwork_appraisers"
    ADD CONSTRAINT "artwork_appraisers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."artwork_bibliography"
    ADD CONSTRAINT "artwork_bibliography_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artwork_collectors"
    ADD CONSTRAINT "artwork_collectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artwork_update_log"
    ADD CONSTRAINT "artwork_update_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_tag_id_key" UNIQUE ("tag_id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bibliography"
    ADD CONSTRAINT "bibliography_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collectors"
    ADD CONSTRAINT "collectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_users"
    ADD CONSTRAINT "location_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_unique" UNIQUE ("role", "permission");



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_users"
    ADD CONSTRAINT "unique_user_location" UNIQUE ("location_id", "user_id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_permission_key" UNIQUE ("user_id", "permission");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_artworks_location_id" ON "public"."artworks" USING "btree" ("location_id");



CREATE INDEX "idx_location_users_is_active" ON "public"."location_users" USING "btree" ("is_active");



CREATE INDEX "idx_location_users_location_id" ON "public"."location_users" USING "btree" ("location_id");



CREATE INDEX "idx_location_users_user_id" ON "public"."location_users" USING "btree" ("user_id");



CREATE INDEX "idx_locations_is_active" ON "public"."locations" USING "btree" ("is_active");



CREATE INDEX "idx_locations_manager_id" ON "public"."locations" USING "btree" ("manager_id");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");



CREATE INDEX "idx_profiles_deleted_at" ON "public"."profiles" USING "btree" ("deleted_at");



CREATE INDEX "idx_profiles_is_active" ON "public"."profiles" USING "btree" ("is_active");



CREATE INDEX "idx_user_permissions_user_id" ON "public"."user_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "cleanup_old_avatar_trigger" AFTER UPDATE OF "avatar_url" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."delete_old_avatar"();



CREATE OR REPLACE TRIGGER "prevent_unauthorized_profile_changes" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."check_profile_update_permissions"();

ALTER TABLE "public"."profiles" DISABLE TRIGGER "prevent_unauthorized_profile_changes";



CREATE OR REPLACE TRIGGER "trigger_log_artwork_update" BEFORE UPDATE ON "public"."artworks" FOR EACH ROW EXECUTE FUNCTION "public"."log_artwork_update"();



CREATE OR REPLACE TRIGGER "trigger_log_status_history" BEFORE UPDATE ON "public"."tags" FOR EACH ROW WHEN (("old"."active" IS DISTINCT FROM "new"."active")) EXECUTE FUNCTION "public"."log_status_history"();



CREATE OR REPLACE TRIGGER "trigger_set_deleted_fields" BEFORE UPDATE ON "public"."artworks" FOR EACH ROW WHEN ((("old"."deleted_at" IS NULL) AND ("new"."deleted_at" IS NOT NULL))) EXECUTE FUNCTION "public"."set_deleted_fields"();



CREATE OR REPLACE TRIGGER "trigger_set_updated_by" BEFORE UPDATE ON "public"."artworks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "trigger_update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_location_users_updated_at" BEFORE UPDATE ON "public"."location_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_locations_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."appraisal_appraisers"
    ADD CONSTRAINT "appraisal_appraisers_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "public"."artwork_appraisals"("id");



ALTER TABLE ONLY "public"."appraisal_appraisers"
    ADD CONSTRAINT "appraisal_appraisers_appraiser_id_fkey" FOREIGN KEY ("appraiser_id") REFERENCES "public"."artwork_appraisers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_appraisers"
    ADD CONSTRAINT "appraisal_appraisers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."appraisal_appraisers"
    ADD CONSTRAINT "appraisal_appraisers_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."appraisal_appraisers"
    ADD CONSTRAINT "appraisal_appraisers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_appraisals"
    ADD CONSTRAINT "artwork_appraisals_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id");



ALTER TABLE ONLY "public"."artwork_appraisers"
    ADD CONSTRAINT "artwork_appraiser_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_appraisers"
    ADD CONSTRAINT "artwork_appraiser_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_appraisers"
    ADD CONSTRAINT "artwork_appraiser_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_appraisers"
    ADD CONSTRAINT "artwork_appraiser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artwork_bibliography"
    ADD CONSTRAINT "artwork_bibliography_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id");



ALTER TABLE ONLY "public"."artwork_bibliography"
    ADD CONSTRAINT "artwork_bibliography_bibliography_id_fkey" FOREIGN KEY ("bibliography_id") REFERENCES "public"."bibliography"("id");



ALTER TABLE ONLY "public"."artwork_bibliography"
    ADD CONSTRAINT "artwork_bibliography_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_bibliography"
    ADD CONSTRAINT "artwork_bibliography_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_bibliography"
    ADD CONSTRAINT "artwork_bibliography_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_bibliography"
    ADD CONSTRAINT "artwork_bibliography_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artwork_collectors"
    ADD CONSTRAINT "artwork_collectors_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id");



ALTER TABLE ONLY "public"."artwork_collectors"
    ADD CONSTRAINT "artwork_collectors_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "public"."collectors"("id");



ALTER TABLE ONLY "public"."artwork_collectors"
    ADD CONSTRAINT "artwork_collectors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_collectors"
    ADD CONSTRAINT "artwork_collectors_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_collectors"
    ADD CONSTRAINT "artwork_collectors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artwork_collectors"
    ADD CONSTRAINT "artwork_collectors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artwork_update_log"
    ADD CONSTRAINT "artwork_update_log_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artwork_update_log"
    ADD CONSTRAINT "artwork_update_log_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_tag_issued_by_fkey" FOREIGN KEY ("tag_issued_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id");



ALTER TABLE ONLY "public"."bibliography"
    ADD CONSTRAINT "bibliography_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bibliography"
    ADD CONSTRAINT "bibliography_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bibliography"
    ADD CONSTRAINT "bibliography_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bibliography"
    ADD CONSTRAINT "bibliography_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."collectors"
    ADD CONSTRAINT "collectors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."collectors"
    ADD CONSTRAINT "collectors_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."collectors"
    ADD CONSTRAINT "collectors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."collectors"
    ADD CONSTRAINT "collectors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_users"
    ADD CONSTRAINT "location_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."location_users"
    ADD CONSTRAINT "location_users_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_users"
    ADD CONSTRAINT "location_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_deleted_by_fkey1" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_updated_by_fkey1" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete profiles" ON "public"."profiles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_new") AND ("p"."is_active" = true)))));



CREATE POLICY "Admins can insert profiles" ON "public"."profiles" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_new") AND ("p"."is_active" = true)))));



CREATE POLICY "Admins can manage all permissions" ON "public"."user_permissions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Admins can manage all sessions" ON "public"."user_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Admins can manage location assignments" ON "public"."location_users" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Admins can manage locations" ON "public"."locations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Admins can update any profile" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role_new") AND ("p"."is_active" = true)))));



CREATE POLICY "All - all" ON "public"."assets" USING (true) WITH CHECK (true);



CREATE POLICY "Allow read" ON "public"."artwork_bibliography" FOR SELECT USING (true);



CREATE POLICY "Allow read" ON "public"."artwork_collectors" FOR SELECT USING (true);



CREATE POLICY "Allow read" ON "public"."bibliography" FOR SELECT USING (true);



CREATE POLICY "Allow read" ON "public"."collectors" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can view all profiles" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authorized users can create artworks" ON "public"."artworks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new", 'issuer'::"public"."user_role_new", 'staff'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Authorized users can delete artworks" ON "public"."artworks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Authorized users can manage tags" ON "public"."tags" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new", 'issuer'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Authorized users can update artworks" ON "public"."artworks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_user'::"public"."user_role_new", 'admin'::"public"."user_role_new", 'issuer'::"public"."user_role_new", 'staff'::"public"."user_role_new"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Enable delete for authenticated users" ON "public"."appraisal_appraisers" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."appraisal_appraisers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."artwork_appraisals" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."status_history" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."appraisal_appraisers" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."artwork_appraisals" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."role_permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for users based on email" ON "public"."appraisal_appraisers" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for users based on email" ON "public"."artwork_appraisals" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Users can delete own sessions" ON "public"."user_sessions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view artworks" ON "public"."artworks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Users can view location assignments" ON "public"."location_users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Users can view locations" ON "public"."locations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Users can view own permissions" ON "public"."user_permissions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view own sessions" ON "public"."user_sessions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view tags" ON "public"."tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_active" = true)))));



ALTER TABLE "public"."appraisal_appraisers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_appraisals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_appraisers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_bibliography" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_collectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artworks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bibliography" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."location_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "base32" TO "anon";
GRANT USAGE ON SCHEMA "base32" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "totp" TO "anon";
GRANT USAGE ON SCHEMA "totp" TO "authenticated";




















































































































































































GRANT ALL ON FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" numeric, "p_width" numeric, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" timestamp with time zone, "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "text"[], "p_collectors" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" numeric, "p_width" numeric, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" timestamp with time zone, "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "text"[], "p_collectors" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" numeric, "p_width" numeric, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" timestamp with time zone, "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "text"[], "p_collectors" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_artwork_v2"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_artwork_v2"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_artwork_v2"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_favorite"("user_id" "uuid", "artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_favorite"("user_id" "uuid", "artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_favorite"("user_id" "uuid", "artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_active" boolean, "p_created_at" timestamp without time zone, "p_updated_at" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_active" boolean, "p_created_at" timestamp without time zone, "p_updated_at" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_active" boolean, "p_created_at" timestamp without time zone, "p_updated_at" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_profile_update_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_profile_update_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_profile_update_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_role"("user_id" "uuid", "check_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_role"("user_id" "uuid", "check_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_role"("user_id" "uuid", "check_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization_admin_direct"("p_user_id" "uuid", "p_organization_id" "uuid", "p_email" "text", "p_full_name" "text", "p_first_name" "text", "p_last_name" "text", "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization_admin_direct"("p_user_id" "uuid", "p_organization_id" "uuid", "p_email" "text", "p_full_name" "text", "p_first_name" "text", "p_last_name" "text", "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_admin_direct"("p_user_id" "uuid", "p_organization_id" "uuid", "p_email" "text", "p_full_name" "text", "p_first_name" "text", "p_last_name" "text", "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user"("email" "text", "password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user"("email" "text", "password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user"("email" "text", "password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_manually"("user_email" "text", "user_password" "text", "first_name" "text", "last_name" "text", "user_role" "text", "user_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_manually"("user_email" "text", "user_password" "text", "first_name" "text", "last_name" "text", "user_role" "text", "user_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_manually"("user_email" "text", "user_password" "text", "first_name" "text", "last_name" "text", "user_role" "text", "user_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_with_profile"("p_email" "text", "p_password" "text", "p_first_name" "text", "p_last_name" "text", "p_role" "public"."user_role_new", "p_phone" "text", "p_avatar_url" "text", "p_permissions" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("p_email" "text", "p_password" "text", "p_first_name" "text", "p_last_name" "text", "p_role" "public"."user_role_new", "p_phone" "text", "p_avatar_url" "text", "p_permissions" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_with_profile"("p_email" "text", "p_password" "text", "p_first_name" "text", "p_last_name" "text", "p_role" "public"."user_role_new", "p_phone" "text", "p_avatar_url" "text", "p_permissions" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_cascade"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_cascade"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_cascade"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_users_with_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_users_with_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_users_with_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_artwork_favorite_count"("p_artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_artwork_favorite_count"("p_artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_artwork_favorite_count"("p_artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_artwork_list"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_artwork_list"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_artwork_list"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_image_urls"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_image_urls"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_image_urls"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_location_users_with_email"("p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_location_users_with_email"("p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_location_users_with_email"("p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_users_secure"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_users_secure"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_users_secure"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_users_with_email"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_users_with_email"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_users_with_email"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_artworks"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_artworks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_artworks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profiles_with_email"("p_page" integer, "p_page_size" integer, "p_role" "text", "p_is_active" boolean, "p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profiles_with_email"("p_page" integer, "p_page_size" integer, "p_role" "text", "p_is_active" boolean, "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profiles_with_email"("p_page" integer, "p_page_size" integer, "p_role" "text", "p_is_active" boolean, "p_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_server_datetime"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_server_datetime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_server_datetime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_favorites"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_favorites"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_favorites"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_locations"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_locations"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_locations"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_with_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_with_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_with_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_in_my_locations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_in_my_locations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_in_my_locations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_user_permission"("target_user_id" "uuid", "permission_name" "text", "granted_by_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_user_permission"("target_user_id" "uuid", "permission_name" "text", "granted_by_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_user_permission"("target_user_id" "uuid", "permission_name" "text", "granted_by_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("check_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("check_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("check_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_in_location"("p_user_id" "uuid", "p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_in_location"("p_user_id" "uuid", "p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_in_location"("p_user_id" "uuid", "p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_artwork_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_artwork_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_artwork_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_status_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_status_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_status_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_favorite"("user_id" "uuid", "artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_favorite"("user_id" "uuid", "artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_favorite"("user_id" "uuid", "artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_user_permission"("target_user_id" "uuid", "permission_name" "text", "revoked_by_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_user_permission"("target_user_id" "uuid", "permission_name" "text", "revoked_by_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_user_permission"("target_user_id" "uuid", "permission_name" "text", "revoked_by_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_delete_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_delete_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_delete_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_artworks"("search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_artworks"("search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_artworks"("search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_deleted_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_deleted_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_deleted_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "service_role";



GRANT ALL ON TABLE "public"."artworks" TO "anon";
GRANT ALL ON TABLE "public"."artworks" TO "authenticated";
GRANT ALL ON TABLE "public"."artworks" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_id_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_id_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" integer, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb", "p_id_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profile"("user_first_name" "text", "user_last_name" "text", "user_phone" "text", "user_avatar_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profile"("user_first_name" "text", "user_last_name" "text", "user_phone" "text", "user_avatar_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profile"("user_first_name" "text", "user_last_name" "text", "user_phone" "text", "user_avatar_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "public"."user_role", "updated_by_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "public"."user_role", "updated_by_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_role"("target_user_id" "uuid", "new_role" "public"."user_role", "updated_by_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_status"("target_user_id" "uuid", "new_status" boolean, "updated_by_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_status"("target_user_id" "uuid", "new_status" boolean, "updated_by_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_status"("target_user_id" "uuid", "new_status" boolean, "updated_by_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_access_artwork"("p_user_id" "uuid", "p_artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_access_artwork"("p_user_id" "uuid", "p_artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_access_artwork"("p_user_id" "uuid", "p_artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_access_location"("p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_access_location"("p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_access_location"("p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_location_access"("p_user_id" "uuid", "p_location_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_location_access"("p_user_id" "uuid", "p_location_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_location_access"("p_user_id" "uuid", "p_location_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_otp"("artwork_id" "uuid", "otp_provided" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_otp"("artwork_id" "uuid", "otp_provided" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_otp"("artwork_id" "uuid", "otp_provided" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."appraisal_appraisers" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_appraisers" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_appraisers" TO "service_role";



GRANT ALL ON TABLE "public"."artwork_appraisals" TO "anon";
GRANT ALL ON TABLE "public"."artwork_appraisals" TO "authenticated";
GRANT ALL ON TABLE "public"."artwork_appraisals" TO "service_role";



GRANT ALL ON TABLE "public"."artwork_appraisers" TO "anon";
GRANT ALL ON TABLE "public"."artwork_appraisers" TO "authenticated";
GRANT ALL ON TABLE "public"."artwork_appraisers" TO "service_role";



GRANT ALL ON TABLE "public"."artwork_bibliography" TO "anon";
GRANT ALL ON TABLE "public"."artwork_bibliography" TO "authenticated";
GRANT ALL ON TABLE "public"."artwork_bibliography" TO "service_role";



GRANT ALL ON TABLE "public"."artwork_collectors" TO "anon";
GRANT ALL ON TABLE "public"."artwork_collectors" TO "authenticated";
GRANT ALL ON TABLE "public"."artwork_collectors" TO "service_role";



GRANT ALL ON TABLE "public"."artwork_stats" TO "anon";
GRANT ALL ON TABLE "public"."artwork_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."artwork_stats" TO "service_role";



GRANT ALL ON TABLE "public"."artwork_update_log" TO "anon";
GRANT ALL ON TABLE "public"."artwork_update_log" TO "authenticated";
GRANT ALL ON TABLE "public"."artwork_update_log" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."bibliography" TO "anon";
GRANT ALL ON TABLE "public"."bibliography" TO "authenticated";
GRANT ALL ON TABLE "public"."bibliography" TO "service_role";



GRANT ALL ON TABLE "public"."collectors" TO "anon";
GRANT ALL ON TABLE "public"."collectors" TO "authenticated";
GRANT ALL ON TABLE "public"."collectors" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."current_user_profile" TO "anon";
GRANT ALL ON TABLE "public"."current_user_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."current_user_profile" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."location_users" TO "anon";
GRANT ALL ON TABLE "public"."location_users" TO "authenticated";
GRANT ALL ON TABLE "public"."location_users" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."nfc_stats" TO "anon";
GRANT ALL ON TABLE "public"."nfc_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."nfc_stats" TO "service_role";



GRANT ALL ON TABLE "public"."profiles_view" TO "anon";
GRANT ALL ON TABLE "public"."profiles_view" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles_view" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."status_history" TO "anon";
GRANT ALL ON TABLE "public"."status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."status_history" TO "service_role";



GRANT ALL ON TABLE "public"."system_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."system_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."system_performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
