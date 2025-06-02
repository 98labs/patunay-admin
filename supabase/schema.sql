

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






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "totp";


ALTER SCHEMA "totp" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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


CREATE OR REPLACE FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text" DEFAULT NULL::"text", "p_expiration_date" "date" DEFAULT NULL::"date", "p_read_write_count" bigint DEFAULT 0, "p_assets" "jsonb" DEFAULT NULL::"jsonb", "p_provenance" "text" DEFAULT NULL::"text", "p_bibliography" "jsonb" DEFAULT NULL::"jsonb", "p_collectors" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("id" "uuid", "idnumber" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "text", "tag_id" "text", "tag_issued_by" "text", "tag_issued_at" timestamp without time zone, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collector" "text", "collectors" "jsonb")
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
        idnumber, title, description, height, width, size_unit, artist, year, medium, tag_id, tag_issued_at, created_at, provenance, bibliography, collectors
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
        (
            SELECT p.first_name || ' ' || p.last_name AS name
            FROM profiles p WHERE p.id = a.created_by
        ) AS created_by,
        a.tag_id,
        (
            SELECT p.first_name || ' ' || p.last_name AS name
            FROM profiles p WHERE p.id = a.tag_issued_by
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
        a.collector,
        a.collectors
    FROM artworks a
    WHERE a.id = v_artwork_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An error occurred while adding artwork: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") OWNER TO "postgres";


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
    idnumber,
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
    artwork->>'idnumber',
    artwork->>'title',
    artwork->>'description',
    (artwork->>'height')::numeric,
    (artwork->>'width')::numeric,
    artwork->>'size_unit',
    artwork->>'artist',
    (artwork->>'year')::int,
    artwork->>'medium',
    artwork->>'tag_id',
    artwork->>'provenance',
    (artwork->>'bibliography')::jsonb,
    (artwork->>'collectors')::jsonb
  FROM jsonb_array_elements(artworks) AS artwork;
END;
$$;


ALTER FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profiles"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.user_profiles(id, email)
  VALUES(NEW.id, NEW.email);
END;$$;


ALTER FUNCTION "public"."create_user_profiles"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") RETURNS TABLE("id" "uuid", "idnumber" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "text", "tag_id" "text", "tag_issued_by" "text", "tag_issued_at" timestamp without time zone, "active" boolean, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collector" "text", "collectors" "jsonb", "condition" character varying, "cost" numeric, "bibliographies" "jsonb", "artwork_collectors" "jsonb", "artwork_appraisals" "jsonb")
    LANGUAGE "plpgsql"
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
        a.collector,
        a.collectors,
        a.condition,
        a.cost,
        COALESCE(jsonb_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL), '[]'::jsonb) as bibliographies,
        COALESCE(jsonb_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL), '[]'::jsonb) as artwork_collectors,
        COALESCE(
    jsonb_agg(DISTINCT jsonb_build_object(
        'id', aa.id,
        'condition', aa.condition,
        'acquisition_cost', aa.acquisition_cost,
        'appraised_value', aa.appraised_value,
        'artist_info', aa.artist_info,
        'recent_auction_references', aa.recent_auction_references,
        'notes', aa.notes,
        'recommendation', aa.recommendation,
        'appraisal_date', aa.appraisal_date,
        'appraisers', (
            SELECT jsonb_agg(jsonb_build_object('id', ap.id, 'name', ap.name))
            FROM appraisal_appraisers apa
            JOIN artwork_appraisers ap ON ap.id = apa.appraiser_id
            WHERE apa.appraisal_id = aa.id
        )
    )) FILTER (WHERE aa.id IS NOT NULL), '[]'::jsonb
) AS art_appraisals
    FROM artworks a
    LEFT JOIN tags t ON t.id = a.tag_id
    LEFT JOIN artwork_bibliography ab on ab.artwork_id = a.id
    LEFT JOIN bibliography b on b.id = ab.bibliography_id
    LEFT JOIN artwork_collectors ac on ac.artwork_id = a.id
    LEFT JOIN collectors c on c.id = ac.collector_id
    LEFT JOIN artwork_appraisals aa ON aa.artwork_id = a.id
    WHERE a.id = p_artwork_id
    GROUP BY
        a.id, a.idnumber, a.title, a.description, a.height, a.width,
        a.size_unit, a.artist, a.year, a.medium, a.tag_id, a.tag_issued_at,
        t.active, a.created_at, a.provenance, a.bibliography, a.collector,
        a.collectors, a.condition, a.cost;
END;
$$;


ALTER FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_artwork_list"() RETURNS TABLE("id" "uuid", "idnumber" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "text", "tag_id" "text", "tag_issued_by" "text", "tag_issued_at" timestamp without time zone, "active" boolean, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collector" "text", "collectors" "jsonb", "condition" character varying, "cost" numeric)
    LANGUAGE "plpgsql"
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
        a.collector,
        a.collectors,
        a.condition,
        a.cost
    FROM artworks a
    LEFT JOIN tags t ON t.id = a.tag_id;  -- Join on `tag_id`
END;
$$;


ALTER FUNCTION "public"."get_artwork_list"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_server_datetime"() RETURNS timestamp without time zone
    LANGUAGE "plpgsql"
    AS $$BEGIN
  RETURN NOW() AT TIME ZONE 'UTC';
END;$$;


ALTER FUNCTION "public"."get_server_datetime"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text" DEFAULT NULL::"text", "p_expiration_date" "date" DEFAULT NULL::"date", "p_read_write_count" bigint DEFAULT 0, "p_assets" "jsonb" DEFAULT NULL::"jsonb", "p_provenance" "text" DEFAULT NULL::"text", "p_bibliography" "jsonb" DEFAULT NULL::"jsonb", "p_collectors" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("id" "uuid", "idnumber" "text", "title" "text", "description" "text", "height" double precision, "width" double precision, "size_unit" "text", "artist" "text", "year" "text", "medium" "text", "created_by" "text", "tag_id" "text", "tag_issued_by" "text", "tag_issued_at" timestamp without time zone, "created_at" timestamp without time zone, "assets" "jsonb", "provenance" "text", "bibliography" "jsonb", "collector" "text", "collectors" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_existing_artwork_id UUID;
    v_tag_id TEXT := NULL;
    v_rows_updated INT;
BEGIN
    -- Validate dimensions
    IF p_height IS NULL OR p_width IS NULL OR p_height <= 0 OR p_width <= 0 THEN
        RAISE EXCEPTION 'Height and width must be positive numbers.';
    END IF;

    -- Process tag logic
    IF p_tag_id IS NOT NULL THEN
        -- Check if tag exists
        SELECT t.id INTO v_tag_id 
        FROM tags t 
        WHERE t.id = p_tag_id;

        -- Add tag if it doesn't exist
        IF v_tag_id IS NULL THEN
            v_tag_id := add_tag(
                p_id := p_tag_id,
                p_expiration_date := p_expiration_date,
                p_read_write_count := p_read_write_count
            );
        END IF;

        -- Validate unique tag_id
        IF v_tag_id IS NOT NULL THEN
            SELECT a.id INTO v_existing_artwork_id
            FROM artworks a
            WHERE a.tag_id = v_tag_id AND a.id <> p_artwork_id;

            IF v_existing_artwork_id IS NOT NULL THEN
                RAISE EXCEPTION 'Tag ID % is already associated with another artwork.', v_tag_id;
            END IF;
        END IF;
    ELSE
        -- Explicitly set v_tag_id to NULL if p_tag_id is NULL
        v_tag_id := NULL;
    END IF;

    -- Debug: Show the incoming values before updating
    RAISE NOTICE 'Updating artwork: % -> title=%, tag_id=%', p_artwork_id, p_title, v_tag_id;

    -- Update artwork
    UPDATE artworks a
    SET 
        title = p_title,
        description = p_description,
        height = p_height,
        width = p_width,
        size_unit = p_size_unit,
        artist = p_artist,
        year = p_year,
        medium = p_medium,
        tag_id = v_tag_id,  -- Will be NULL if p_tag_id is NULL
        updated_at = NOW(),
        provenance = p_provenance,
        bibliography = p_bibliography,
        collectors = p_collectors
    WHERE a.id = p_artwork_id;

    -- Capture affected rows
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated = 0 THEN
        RAISE EXCEPTION 'Artwork update failed. No rows updated for ID %.', p_artwork_id;
    END IF;

    -- Update assets only if new assets are provided
    IF p_assets IS NOT NULL THEN
        DELETE FROM assets WHERE artwork_id = p_artwork_id;

        INSERT INTO assets (artwork_id, filename, url, created_at, sort_order)
        SELECT 
            p_artwork_id,
            asset->>'filename',
            asset->>'url',
            NOW(),
            idx
        FROM jsonb_array_elements(p_assets) WITH ORDINALITY AS asset(asset, idx);
    END IF;

    -- Return updated artwork with assets
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
        (
            SELECT p.first_name || ' ' || p.last_name 
            FROM profiles p 
            WHERE p.id = a.created_by
        ) AS created_by,
        a.tag_id,  -- Explicitly qualified as a.tag_id
        (
            SELECT p.first_name || ' ' || p.last_name 
            FROM profiles p 
            WHERE p.id = a.tag_issued_by
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
        a.collector,
        a.collectors
    FROM artworks a
    WHERE a.id = p_artwork_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An error occurred while updating artwork: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") OWNER TO "postgres";


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

SET default_tablespace = '';

SET default_table_access_method = "heap";


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


CREATE TABLE IF NOT EXISTS "public"."artwork_update_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artwork_id" "uuid" NOT NULL,
    "old_data" "jsonb" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."artwork_update_log" OWNER TO "postgres";


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
    "idnumber" "text",
    "provenance" "text",
    "bibliography" "jsonb" DEFAULT '[]'::"jsonb",
    "collector" "text",
    "collectors" "jsonb" DEFAULT '[]'::"jsonb",
    "condition" character varying,
    "cost" numeric,
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."artworks" OWNER TO "postgres";


COMMENT ON TABLE "public"."artworks" IS 'list of artworks';



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


CREATE TABLE IF NOT EXISTS "public"."enterprises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."enterprises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."plans" IS 'list of plans';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "owner_id" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "deleted_at" timestamp without time zone
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."enterprises"
    ADD CONSTRAINT "enterprises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_history"
    ADD CONSTRAINT "status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "trigger_log_artwork_update" BEFORE UPDATE ON "public"."artworks" FOR EACH ROW EXECUTE FUNCTION "public"."log_artwork_update"();



CREATE OR REPLACE TRIGGER "trigger_log_status_history" BEFORE UPDATE ON "public"."tags" FOR EACH ROW WHEN (("old"."active" IS DISTINCT FROM "new"."active")) EXECUTE FUNCTION "public"."log_status_history"();



CREATE OR REPLACE TRIGGER "trigger_set_deleted_fields" BEFORE UPDATE ON "public"."artworks" FOR EACH ROW WHEN ((("old"."deleted_at" IS NULL) AND ("new"."deleted_at" IS NOT NULL))) EXECUTE FUNCTION "public"."set_deleted_fields"();



CREATE OR REPLACE TRIGGER "trigger_set_updated_by" BEFORE UPDATE ON "public"."artworks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



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



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_owner_id_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_tag_issued_by_fkey" FOREIGN KEY ("tag_issued_by") REFERENCES "auth"."users"("id");



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



ALTER TABLE ONLY "public"."enterprises"
    ADD CONSTRAINT "enterprises_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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
    ADD CONSTRAINT "tags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "All - all" ON "public"."assets" USING (true) WITH CHECK (true);



CREATE POLICY "All - all" ON "public"."enterprises" USING (true) WITH CHECK (true);



CREATE POLICY "All - all" ON "public"."plans" USING (true) WITH CHECK (true);



CREATE POLICY "All - all" ON "public"."profiles" USING (true) WITH CHECK (true);



CREATE POLICY "All - all" ON "public"."workspaces" USING (true) WITH CHECK (true);



CREATE POLICY "Allow read" ON "public"."artwork_bibliography" FOR SELECT USING (true);



CREATE POLICY "Allow read" ON "public"."artwork_collectors" FOR SELECT USING (true);



CREATE POLICY "Allow read" ON "public"."bibliography" FOR SELECT USING (true);



CREATE POLICY "Allow read" ON "public"."collectors" FOR SELECT USING (true);



CREATE POLICY "Allow read on non-deleted rows" ON "public"."artworks" FOR SELECT USING (("deleted_at" IS NULL));



CREATE POLICY "Enable delete for all users" ON "public"."artworks" FOR DELETE USING (true);



CREATE POLICY "Enable insert for all users" ON "public"."artworks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for all users" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."appraisal_appraisers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."artwork_appraisals" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."status_history" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."artwork_appraisers" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."appraisal_appraisers" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."artwork_appraisals" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."artwork_appraisers" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."artworks" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Enable to update for all users" ON "public"."tags" FOR UPDATE USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable update for all users" ON "public"."artworks" FOR UPDATE USING (true);



CREATE POLICY "Enable update for users based on email" ON "public"."appraisal_appraisers" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for users based on email" ON "public"."artwork_appraisals" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for users based on email" ON "public"."artwork_appraisers" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."appraisal_appraisers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_appraisals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_appraisers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_bibliography" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artwork_collectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artworks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bibliography" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enterprises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "base32" TO "anon";
GRANT USAGE ON SCHEMA "base32" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "totp" TO "anon";
GRANT USAGE ON SCHEMA "totp" TO "authenticated";




















































































































































































GRANT ALL ON FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_artwork"("p_idnumber" "text", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_active" boolean, "p_created_at" timestamp without time zone, "p_updated_at" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_active" boolean, "p_created_at" timestamp without time zone, "p_updated_at" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_tag"("p_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_active" boolean, "p_created_at" timestamp without time zone, "p_updated_at" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_add_artwork"("artworks" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_artwork"("input_artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_artwork"("p_artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_artwork_list"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_artwork_list"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_artwork_list"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_server_datetime"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_server_datetime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_server_datetime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_artwork_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_artwork_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_artwork_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_status_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_status_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_status_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_deleted_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_deleted_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_deleted_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_artwork"("p_artwork_id" "uuid", "p_title" "text", "p_description" "text", "p_height" double precision, "p_width" double precision, "p_size_unit" "text", "p_artist" "text", "p_year" "text", "p_medium" "text", "p_tag_id" "text", "p_expiration_date" "date", "p_read_write_count" bigint, "p_assets" "jsonb", "p_provenance" "text", "p_bibliography" "jsonb", "p_collectors" "jsonb") TO "service_role";



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



GRANT ALL ON TABLE "public"."artwork_update_log" TO "anon";
GRANT ALL ON TABLE "public"."artwork_update_log" TO "authenticated";
GRANT ALL ON TABLE "public"."artwork_update_log" TO "service_role";



GRANT ALL ON TABLE "public"."artworks" TO "anon";
GRANT ALL ON TABLE "public"."artworks" TO "authenticated";
GRANT ALL ON TABLE "public"."artworks" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."bibliography" TO "anon";
GRANT ALL ON TABLE "public"."bibliography" TO "authenticated";
GRANT ALL ON TABLE "public"."bibliography" TO "service_role";



GRANT ALL ON TABLE "public"."collectors" TO "anon";
GRANT ALL ON TABLE "public"."collectors" TO "authenticated";
GRANT ALL ON TABLE "public"."collectors" TO "service_role";



GRANT ALL ON TABLE "public"."enterprises" TO "anon";
GRANT ALL ON TABLE "public"."enterprises" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprises" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."status_history" TO "anon";
GRANT ALL ON TABLE "public"."status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."status_history" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";



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
