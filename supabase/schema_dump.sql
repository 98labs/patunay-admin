--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

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

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: base32; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA base32;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgsodium;


--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- Name: EXTENSION pgsodium; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgsodium IS 'Pgsodium is a modern cryptography library for Postgres.';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: totp; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA totp;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: cross_org_permission_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cross_org_permission_type AS ENUM (
    'issuer_access',
    'appraiser_access',
    'viewer_access',
    'consultant_access'
);


--
-- Name: organization_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.organization_type AS ENUM (
    'gallery',
    'museum',
    'artist',
    'collector',
    'auction_house',
    'other'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'staff'
);


--
-- Name: user_role_new; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_new AS ENUM (
    'super_user',
    'admin',
    'issuer',
    'appraiser',
    'staff',
    'viewer'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: base32_alphabet(integer); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.base32_alphabet(input integer) RETURNS character
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: base32_alphabet_to_decimal(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.base32_alphabet_to_decimal(input text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: base32_alphabet_to_decimal_int(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.base32_alphabet_to_decimal_int(input text) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  alphabet text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  alpha int;
BEGIN
  alpha = position(input in alphabet) - 1;
  RETURN alpha;
END;
$$;


--
-- Name: base32_to_decimal(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.base32_to_decimal(input text) RETURNS text[]
    LANGUAGE plpgsql STABLE
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


--
-- Name: binary_to_int(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.binary_to_int(input text) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: decimal_to_chunks(text[]); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.decimal_to_chunks(input text[]) RETURNS text[]
    LANGUAGE plpgsql STABLE
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


--
-- Name: decode(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.decode(input text) RETURNS text
    LANGUAGE plpgsql STABLE
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


--
-- Name: encode(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.encode(input text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: fill_chunks(text[]); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.fill_chunks(input text[]) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: string_nchars(text, integer); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.string_nchars(text, integer) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    AS $_$
SELECT ARRAY(SELECT substring($1 from n for $2)
  FROM generate_series(1, length($1), $2) n);
$_$;


--
-- Name: to_ascii(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.to_ascii(input text) RETURNS integer[]
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: to_base32(text[]); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.to_base32(input text[]) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: to_binary(integer[]); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.to_binary(input integer[]) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: to_binary(integer); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.to_binary(input integer) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: to_chunks(text[]); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.to_chunks(input text[]) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: to_decimal(text[]); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.to_decimal(input text[]) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: to_groups(text[]); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.to_groups(input text[]) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: valid(text); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.valid(input text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
BEGIN 
  IF (upper(input) ~* '^[A-Z2-7]+=*$') THEN 
    RETURN true;
  END IF;
  RETURN false;
END;
$_$;


--
-- Name: zero_fill(integer, integer); Type: FUNCTION; Schema: base32; Owner: -
--

CREATE FUNCTION base32.zero_fill(a integer, b integer) RETURNS bigint
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: add_artwork(text, text, text, double precision, double precision, text, text, text, text, text, date, bigint, jsonb, text, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_artwork(p_idnumber text, p_title text, p_description text, p_height double precision, p_width double precision, p_size_unit text, p_artist text, p_year text, p_medium text, p_tag_id text DEFAULT NULL::text, p_expiration_date date DEFAULT NULL::date, p_read_write_count bigint DEFAULT 0, p_assets jsonb DEFAULT NULL::jsonb, p_provenance text DEFAULT NULL::text, p_bibliography jsonb DEFAULT NULL::jsonb, p_collectors jsonb DEFAULT NULL::jsonb) RETURNS TABLE(id uuid, idnumber text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by text, tag_id text, tag_issued_by text, tag_issued_at timestamp without time zone, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collectors jsonb)
    LANGUAGE plpgsql
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


--
-- Name: add_tag(text, date, bigint, boolean, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_tag(p_id text, p_expiration_date date, p_read_write_count bigint DEFAULT 0, p_active boolean DEFAULT true, p_created_at timestamp without time zone DEFAULT now(), p_updated_at timestamp without time zone DEFAULT now()) RETURNS text
    LANGUAGE plpgsql
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


--
-- Name: bulk_add_artwork(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_add_artwork(artworks jsonb) RETURNS void
    LANGUAGE plpgsql
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


--
-- Name: check_profile_update_permissions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_profile_update_permissions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION check_profile_update_permissions(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_profile_update_permissions() IS 'Prevents non-admin users from changing sensitive fields in their profile';


--
-- Name: check_user_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_role(user_id uuid, check_role text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: create_user(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user(email text, password text) RETURNS void
    LANGUAGE plpgsql
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


--
-- Name: create_user_manually(text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user_manually(user_email text, user_password text, first_name text DEFAULT NULL::text, last_name text DEFAULT NULL::text, user_role text DEFAULT 'staff'::text, user_phone text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: create_user_profiles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user_profiles() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.user_profiles(id, email)
  VALUES(NEW.id, NEW.email);
END;$$;


--
-- Name: delete_artwork(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_artwork(input_artwork_id uuid) RETURNS text
    LANGUAGE plpgsql
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


--
-- Name: delete_old_avatar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_old_avatar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: delete_user_cascade(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user_cascade(user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_all_users_with_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_users_with_roles() RETURNS TABLE(id uuid, email text, first_name text, last_name text, role public.user_role, is_active boolean, phone text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, email_confirmed_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_all_users_with_roles(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_all_users_with_roles() IS 'Get all users with their roles for admin management';


--
-- Name: get_artwork(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artwork(p_artwork_id uuid) RETURNS TABLE(id uuid, idnumber text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by uuid, tag_id text, tag_issued_by uuid, tag_issued_at timestamp without time zone, active boolean, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collector text, collectors jsonb, condition character varying, cost numeric, bibliographies jsonb, artwork_collectors jsonb, artwork_appraisals jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_artwork_list(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artwork_list() RETURNS TABLE(id uuid, idnumber text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by text, tag_id text, tag_issued_by text, tag_issued_at timestamp without time zone, active boolean, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collector text, collectors jsonb, condition character varying, cost numeric)
    LANGUAGE plpgsql
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


--
-- Name: get_location_users_with_email(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_location_users_with_email(p_location_id uuid) RETURNS TABLE(id uuid, location_id uuid, user_id uuid, organization_id uuid, role public.user_role, permissions text[], is_primary_location boolean, can_access_other_locations boolean, department text, "position" text, employee_id text, start_date date, end_date date, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid, deleted_at timestamp with time zone, user_email text, user_first_name text, user_last_name text, user_avatar_url text, location_name text)
    LANGUAGE sql SECURITY DEFINER
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


--
-- Name: FUNCTION get_location_users_with_email(p_location_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_location_users_with_email(p_location_id uuid) IS 'Get location users with their profile data and email addresses';


--
-- Name: get_organization_users_with_email(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_organization_users_with_email(p_organization_id uuid) RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, avatar_url text, role public.user_role_new)
    LANGUAGE sql SECURITY DEFINER
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


--
-- Name: FUNCTION get_organization_users_with_email(p_organization_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_organization_users_with_email(p_organization_id uuid) IS 'Get organization users with their profile data and email addresses';


--
-- Name: get_profiles_with_email(integer, integer, text, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profiles_with_email(p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_role text DEFAULT NULL::text, p_is_active boolean DEFAULT NULL::boolean, p_search text DEFAULT NULL::text) RETURNS TABLE(id uuid, name text, role text, is_active boolean, created_at timestamp without time zone, email text, total_count integer)
    LANGUAGE plpgsql
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


--
-- Name: get_server_datetime(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_server_datetime() RETURNS timestamp without time zone
    LANGUAGE plpgsql
    AS $$BEGIN
  RETURN NOW() AT TIME ZONE 'UTC';
END;$$;


--
-- Name: get_user_locations(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_locations(p_user_id uuid) RETURNS TABLE(location_id uuid, location_name character varying, organization_id uuid, organization_name character varying, role public.user_role, is_primary_location boolean, can_access_other_locations boolean)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_user_with_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_with_role(user_id uuid) RETURNS TABLE(id uuid, email text, first_name text, last_name text, role public.user_role, is_active boolean, phone text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, permissions text[])
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION get_user_with_role(user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_with_role(user_id uuid) IS 'Get user details with role and permissions';


--
-- Name: get_users_in_my_locations(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_users_in_my_locations() RETURNS TABLE(id uuid, location_id uuid, user_id uuid, organization_id uuid, role public.user_role, permissions text[], is_primary_location boolean, can_access_other_locations boolean, department character varying, "position" character varying, employee_id character varying, is_active boolean, start_date date, end_date date, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid, deleted_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: grant_user_permission(uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_user_permission(target_user_id uuid, permission_name text, granted_by_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: is_user_in_location(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_in_location(p_user_id uuid, p_location_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: log_artwork_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_artwork_update() RETURNS trigger
    LANGUAGE plpgsql
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


--
-- Name: log_status_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_status_history() RETURNS trigger
    LANGUAGE plpgsql
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


--
-- Name: revoke_user_permission(uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.revoke_user_permission(target_user_id uuid, permission_name text, revoked_by_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: safe_delete_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.safe_delete_user(user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: set_deleted_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_deleted_fields() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  NEW.deleted_at := now();
  NEW.deleted_by := auth.uid();
  return NEW;
end;
$$;


--
-- Name: set_updated_by(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_by() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  NEW.updated_by := auth.uid();
  return NEW;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: artworks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artworks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    height double precision,
    width double precision,
    size_unit text,
    artist text NOT NULL,
    year text NOT NULL,
    medium text,
    created_by uuid DEFAULT auth.uid(),
    tag_id text,
    tag_issued_by uuid DEFAULT auth.uid(),
    tag_issued_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
    updated_at timestamp without time zone,
    id_number text,
    provenance text,
    bibliography jsonb DEFAULT '[]'::jsonb,
    collectors jsonb DEFAULT '[]'::jsonb,
    updated_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    read_write_count bigint,
    organization_id uuid,
    location_id uuid
);


--
-- Name: TABLE artworks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.artworks IS 'list of artworks';


--
-- Name: update_artwork(uuid, text, text, double precision, double precision, text, text, text, text, text, date, integer, jsonb, text, jsonb, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_artwork(p_artwork_id uuid, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_height double precision DEFAULT NULL::double precision, p_width double precision DEFAULT NULL::double precision, p_size_unit text DEFAULT NULL::text, p_artist text DEFAULT NULL::text, p_year text DEFAULT NULL::text, p_medium text DEFAULT NULL::text, p_tag_id text DEFAULT NULL::text, p_expiration_date date DEFAULT NULL::date, p_read_write_count integer DEFAULT NULL::integer, p_assets jsonb DEFAULT NULL::jsonb, p_provenance text DEFAULT NULL::text, p_bibliography jsonb DEFAULT NULL::jsonb, p_collectors jsonb DEFAULT NULL::jsonb, p_id_number text DEFAULT NULL::text) RETURNS SETOF public.artworks
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: update_last_login(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_last_login() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_profile(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_profile(user_first_name text DEFAULT NULL::text, user_last_name text DEFAULT NULL::text, user_phone text DEFAULT NULL::text, user_avatar_url text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: update_user_role(uuid, public.user_role, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_role(target_user_id uuid, new_role public.user_role, updated_by_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: update_user_status(uuid, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_status(target_user_id uuid, new_status boolean, updated_by_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: user_can_access_artwork(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can_access_artwork(p_user_id uuid, p_artwork_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: user_can_access_location(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can_access_location(p_location_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: user_has_location_access(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_location_access(p_user_id uuid, p_location_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: validate_otp(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_otp(artwork_id uuid, otp_provided integer) RETURNS boolean
    LANGUAGE plpgsql
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


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: base32_to_hex(text); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.base32_to_hex(input text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: generate(text, integer, integer, timestamp with time zone, text, text, integer); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.generate(secret text, period integer DEFAULT 30, digits integer DEFAULT 6, time_from timestamp with time zone DEFAULT now(), hash text DEFAULT 'sha1'::text, encoding text DEFAULT 'base32'::text, clock_offset integer DEFAULT 0) RETURNS text
    LANGUAGE plpgsql STABLE
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


--
-- Name: generate_secret(text); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.generate_secret(hash text DEFAULT 'sha1'::text) RETURNS bytea
    LANGUAGE plpgsql
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


--
-- Name: hotp(bytea, integer, integer, text); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.hotp(key bytea, c integer, digits integer DEFAULT 6, hash text DEFAULT 'sha1'::text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: pad_secret(bytea, integer); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.pad_secret(input bytea, len integer) RETURNS bytea
    LANGUAGE plpgsql IMMUTABLE
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


--
-- Name: random_base32(integer); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.random_base32(_length integer DEFAULT 20) RETURNS text
    LANGUAGE sql
    AS $$
  SELECT
    string_agg(('{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,2,3,4,5,6,7}'::text[])[ceil(random() * 32)], '')
  FROM
    generate_series(1, _length);
$$;


--
-- Name: url(text, text, integer, text); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.url(email text, totp_secret text, totp_interval integer, totp_issuer text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    concat('otpauth://totp/', totp.urlencode (email), '?secret=', totp.urlencode (totp_secret), '&period=', totp.urlencode (totp_interval::text), '&issuer=', totp.urlencode (totp_issuer));
$$;


--
-- Name: urlencode(text); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.urlencode(in_str text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE STRICT
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


--
-- Name: verify(text, text, integer, integer, timestamp with time zone, text, text, integer); Type: FUNCTION; Schema: totp; Owner: -
--

CREATE FUNCTION totp.verify(secret text, check_totp text, period integer DEFAULT 30, digits integer DEFAULT 6, time_from timestamp with time zone DEFAULT now(), hash text DEFAULT 'sha1'::text, encoding text DEFAULT 'base32'::text, clock_offset integer DEFAULT 0) RETURNS boolean
    LANGUAGE sql
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


--
-- Name: secrets_encrypt_secret_secret(); Type: FUNCTION; Schema: vault; Owner: -
--

CREATE FUNCTION vault.secrets_encrypt_secret_secret() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
		BEGIN
		        new.secret = CASE WHEN new.secret IS NULL THEN NULL ELSE
			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.secret, 'utf8'),
				pg_catalog.convert_to((new.id::text || new.description::text || new.created_at::text || new.updated_at::text)::text, 'utf8'),
				new.key_id::uuid,
				new.nonce
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: appraisal_appraisers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appraisal_appraisers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appraisal_id uuid,
    appraiser_id uuid,
    created_at timestamp without time zone,
    created_by uuid,
    updated_at timestamp without time zone,
    updated_by uuid,
    deleted_at timestamp without time zone,
    deleted_by uuid
);


--
-- Name: artwork_appraisals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artwork_appraisals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    condition text,
    acquisition_cost numeric,
    appraised_value numeric,
    artist_info text,
    recent_auction_references text[],
    notes text,
    recommendation text,
    appraisal_date date,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    artwork_id uuid
);


--
-- Name: artwork_appraisers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artwork_appraisers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    organization text,
    created_by uuid,
    updated_at timestamp without time zone,
    updated_by uuid,
    deleted_at timestamp without time zone,
    deleted_by uuid,
    user_id uuid,
    organization_id uuid
);


--
-- Name: artwork_bibliography; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artwork_bibliography (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    artwork_id uuid DEFAULT gen_random_uuid() NOT NULL,
    bibliography_id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by uuid,
    updated_at timestamp without time zone,
    updated_by uuid,
    deleted_at timestamp without time zone,
    deleted_by uuid,
    user_id uuid
);


--
-- Name: artwork_collectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artwork_collectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    artwork_id uuid DEFAULT gen_random_uuid(),
    collector_id uuid DEFAULT gen_random_uuid(),
    created_by uuid DEFAULT gen_random_uuid(),
    updated_at timestamp without time zone,
    updated_by uuid DEFAULT gen_random_uuid(),
    deleted_at timestamp without time zone,
    deleted_by uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid()
);


--
-- Name: artwork_update_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artwork_update_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artwork_id uuid NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    old_data jsonb,
    new_data jsonb,
    changes jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artwork_id uuid,
    filename text,
    url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    sort_order bigint DEFAULT '0'::bigint
);


--
-- Name: bibliography; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bibliography (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    description character varying,
    created_by uuid DEFAULT gen_random_uuid(),
    updated_at timestamp without time zone,
    updated_by uuid DEFAULT gen_random_uuid(),
    deleted_at timestamp without time zone,
    deleted_by uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid()
);


--
-- Name: collectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    description character varying,
    created_by uuid DEFAULT gen_random_uuid(),
    updated_at timestamp without time zone,
    updated_by uuid DEFAULT gen_random_uuid(),
    deleted_at timestamp without time zone,
    deleted_by uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid()
);


--
-- Name: cross_org_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cross_org_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    permission_type public.cross_org_permission_type NOT NULL,
    permissions text[] DEFAULT '{}'::text[],
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL,
    updated_by uuid,
    approved_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT cross_org_permissions_expiry_check CHECK (((expires_at IS NULL) OR (expires_at > created_at)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    first_name text,
    last_name text,
    is_active boolean DEFAULT true,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    last_login_at timestamp with time zone,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    organization_id uuid,
    role public.user_role_new DEFAULT 'viewer'::public.user_role_new NOT NULL
);


--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.profiles IS 'User profiles with RLS policies for user management. Admins can manage all users, users can view/update their own profile.';


--
-- Name: current_user_profile; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.current_user_profile AS
 SELECT p.id,
    p.first_name,
    p.last_name,
    p.is_active,
    p.phone,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by,
    p.last_login_at,
    p.deleted_at,
    p.deleted_by,
    p.organization_id,
    p.role,
    u.email
   FROM (public.profiles p
     JOIN auth.users u ON ((u.id = p.id)))
  WHERE (p.id = auth.uid());


--
-- Name: location_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    location_id uuid NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    role public.user_role DEFAULT 'staff'::public.user_role NOT NULL,
    permissions text[] DEFAULT '{}'::text[],
    is_primary_location boolean DEFAULT false,
    can_access_other_locations boolean DEFAULT false,
    department character varying(100),
    "position" character varying(100),
    employee_id character varying(50),
    is_active boolean DEFAULT true,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    deleted_at timestamp with time zone
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    description text,
    address jsonb DEFAULT '{}'::jsonb,
    street character varying(255),
    city character varying(100),
    state character varying(100),
    country character varying(100),
    postal_code character varying(20),
    latitude numeric(10,8),
    longitude numeric(11,8),
    phone character varying(50),
    email character varying(255),
    manager_id uuid,
    settings jsonb DEFAULT '{}'::jsonb,
    is_headquarters boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: my_accessible_locations; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.my_accessible_locations AS
 SELECT l.id,
    l.organization_id,
    l.name,
    l.code,
    l.description,
    l.address,
    l.street,
    l.city,
    l.state,
    l.country,
    l.postal_code,
    l.latitude,
    l.longitude,
    l.phone,
    l.email,
    l.manager_id,
    l.settings,
    l.is_headquarters,
    l.is_active,
    l.created_at,
    l.updated_at,
    l.deleted_at
   FROM public.locations l
  WHERE public.user_can_access_location(l.id);


--
-- Name: organization_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.user_role_new NOT NULL,
    permissions text[] DEFAULT '{}'::text[],
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    joined_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT organization_users_role_permissions_check CHECK (((role = 'super_user'::public.user_role_new) OR ((permissions IS NOT NULL) AND (array_length(permissions, 1) >= 0))))
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type public.organization_type DEFAULT 'other'::public.organization_type NOT NULL,
    description text,
    website text,
    contact_email text,
    contact_phone text,
    address jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT organizations_email_check CHECK (((contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) OR (contact_email IS NULL))),
    CONSTRAINT organizations_name_check CHECK ((length(name) >= 2))
);


--
-- Name: profiles_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.profiles_view AS
 SELECT p.id,
    p.first_name,
    p.last_name,
    p.is_active,
    p.phone,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by,
    p.last_login_at,
    p.deleted_at,
    p.deleted_by,
    p.organization_id,
    p.role,
    u.email,
    u.created_at AS user_created_at
   FROM (public.profiles p
     JOIN auth.users u ON ((u.id = p.id)));


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role public.user_role_new NOT NULL,
    permission text NOT NULL,
    description text,
    category text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_id text NOT NULL,
    status boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid DEFAULT gen_random_uuid(),
    updated_at timestamp without time zone,
    updated_by uuid DEFAULT gen_random_uuid(),
    deleted_at timestamp without time zone,
    deleted_by uuid,
    user_id uuid
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id text NOT NULL,
    read_write_count bigint DEFAULT '0'::bigint NOT NULL,
    expiration_date date,
    active boolean DEFAULT true NOT NULL,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    updated_by uuid,
    deleted_at timestamp without time zone,
    deleted_by uuid,
    user_id uuid,
    organization_id uuid
);


--
-- Name: TABLE tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tags IS 'list of nfc tags';


--
-- Name: user_effective_permissions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_effective_permissions AS
 SELECT DISTINCT ou.user_id,
    ou.organization_id,
    (ou.role)::text AS role,
    rp.permission,
    rp.category,
    'direct'::text AS permission_source
   FROM (public.organization_users ou
     JOIN public.role_permissions rp ON ((rp.role = ou.role)))
  WHERE ((ou.is_active = true) AND (rp.is_active = true))
UNION ALL
 SELECT DISTINCT cop.user_id,
    cop.organization_id,
    NULL::text AS role,
    unnest(cop.permissions) AS permission,
    'cross_org'::text AS category,
    'cross_org'::text AS permission_source
   FROM public.cross_org_permissions cop
  WHERE ((cop.is_active = true) AND ((cop.expires_at IS NULL) OR (cop.expires_at > now())));


--
-- Name: user_organizations; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_organizations AS
 SELECT ou.user_id,
    o.id,
    o.name,
    o.type,
    o.description,
    o.website,
    o.contact_email,
    o.contact_phone,
    o.address,
    o.settings,
    o.is_active,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.updated_by,
    o.deleted_at,
    o.deleted_by,
    ou.role AS user_role,
    ou.is_primary,
    ou.permissions AS additional_permissions,
    ou.is_active AS membership_active
   FROM (public.organization_users ou
     JOIN public.organizations o ON ((o.id = ou.organization_id)))
  WHERE ((ou.is_active = true) AND (o.is_active = true));


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    permission text NOT NULL,
    granted_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_permissions IS 'User-specific permissions for fine-grained access control';


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_token text,
    ip_address inet,
    user_agent text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_sessions IS 'User session tracking for security and analytics';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: decrypted_secrets; Type: VIEW; Schema: vault; Owner: -
--

CREATE VIEW vault.decrypted_secrets AS
 SELECT secrets.id,
    secrets.name,
    secrets.description,
    secrets.secret,
        CASE
            WHEN (secrets.secret IS NULL) THEN NULL::text
            ELSE
            CASE
                WHEN (secrets.key_id IS NULL) THEN NULL::text
                ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(secrets.secret, 'base64'::text), convert_to(((((secrets.id)::text || secrets.description) || (secrets.created_at)::text) || (secrets.updated_at)::text), 'utf8'::name), secrets.key_id, secrets.nonce), 'utf8'::name)
            END
        END AS decrypted_secret,
    secrets.key_id,
    secrets.nonce,
    secrets.created_at,
    secrets.updated_at
   FROM vault.secrets;


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: appraisal_appraisers appraisal_appraisers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_appraisers
    ADD CONSTRAINT appraisal_appraisers_pkey PRIMARY KEY (id);


--
-- Name: artwork_appraisers art_appraiser_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisers
    ADD CONSTRAINT art_appraiser_pkey PRIMARY KEY (id);


--
-- Name: artwork_appraisals artwork_appraisals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisals
    ADD CONSTRAINT artwork_appraisals_pkey PRIMARY KEY (id);


--
-- Name: artwork_appraisers artwork_appraisers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisers
    ADD CONSTRAINT artwork_appraisers_name_key UNIQUE (name);


--
-- Name: artwork_bibliography artwork_bibliography_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_bibliography
    ADD CONSTRAINT artwork_bibliography_pkey PRIMARY KEY (id);


--
-- Name: artwork_collectors artwork_collectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_collectors
    ADD CONSTRAINT artwork_collectors_pkey PRIMARY KEY (id);


--
-- Name: artwork_update_log artwork_update_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_update_log
    ADD CONSTRAINT artwork_update_log_pkey PRIMARY KEY (id);


--
-- Name: artworks artworks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_pkey PRIMARY KEY (id);


--
-- Name: artworks artworks_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_tag_id_key UNIQUE (tag_id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: bibliography bibliography_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bibliography
    ADD CONSTRAINT bibliography_pkey PRIMARY KEY (id);


--
-- Name: collectors collectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collectors
    ADD CONSTRAINT collectors_pkey PRIMARY KEY (id);


--
-- Name: cross_org_permissions cross_org_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_pkey PRIMARY KEY (id);


--
-- Name: cross_org_permissions cross_org_permissions_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_unique UNIQUE (user_id, organization_id, permission_type);


--
-- Name: location_users location_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_users
    ADD CONSTRAINT location_users_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: organization_users organization_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_pkey PRIMARY KEY (id);


--
-- Name: organization_users organization_users_unique_user_org; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_unique_user_org UNIQUE (organization_id, user_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_unique UNIQUE (role, permission);


--
-- Name: status_history status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: locations unique_location_code_per_org; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT unique_location_code_per_org UNIQUE (organization_id, code);


--
-- Name: locations unique_location_name_per_org; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT unique_location_name_per_org UNIQUE (organization_id, name);


--
-- Name: location_users unique_user_location; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_users
    ADD CONSTRAINT unique_user_location UNIQUE (location_id, user_id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_permission_key UNIQUE (user_id, permission);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_artwork_appraisers_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artwork_appraisers_organization_id ON public.artwork_appraisers USING btree (organization_id);


--
-- Name: idx_artworks_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artworks_location_id ON public.artworks USING btree (location_id);


--
-- Name: idx_artworks_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artworks_organization_id ON public.artworks USING btree (organization_id);


--
-- Name: idx_cross_org_permissions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cross_org_permissions_active ON public.cross_org_permissions USING btree (is_active);


--
-- Name: idx_cross_org_permissions_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cross_org_permissions_expires ON public.cross_org_permissions USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_cross_org_permissions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cross_org_permissions_org_id ON public.cross_org_permissions USING btree (organization_id);


--
-- Name: idx_cross_org_permissions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cross_org_permissions_type ON public.cross_org_permissions USING btree (permission_type);


--
-- Name: idx_cross_org_permissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cross_org_permissions_user_id ON public.cross_org_permissions USING btree (user_id);


--
-- Name: idx_location_users_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_users_is_active ON public.location_users USING btree (is_active);


--
-- Name: idx_location_users_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_users_location_id ON public.location_users USING btree (location_id);


--
-- Name: idx_location_users_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_users_organization_id ON public.location_users USING btree (organization_id);


--
-- Name: idx_location_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_users_user_id ON public.location_users USING btree (user_id);


--
-- Name: idx_locations_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_is_active ON public.locations USING btree (is_active);


--
-- Name: idx_locations_manager_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_manager_id ON public.locations USING btree (manager_id);


--
-- Name: idx_locations_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_organization_id ON public.locations USING btree (organization_id);


--
-- Name: idx_organization_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organization_users_active ON public.organization_users USING btree (is_active);


--
-- Name: idx_organization_users_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organization_users_org_id ON public.organization_users USING btree (organization_id);


--
-- Name: idx_organization_users_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organization_users_primary ON public.organization_users USING btree (is_primary) WHERE (is_primary = true);


--
-- Name: idx_organization_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organization_users_role ON public.organization_users USING btree (role);


--
-- Name: idx_organization_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organization_users_user_id ON public.organization_users USING btree (user_id);


--
-- Name: idx_organizations_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_active ON public.organizations USING btree (is_active);


--
-- Name: idx_organizations_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_created_by ON public.organizations USING btree (created_by);


--
-- Name: idx_organizations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_type ON public.organizations USING btree (type);


--
-- Name: idx_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);


--
-- Name: idx_profiles_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_deleted_at ON public.profiles USING btree (deleted_at);


--
-- Name: idx_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);


--
-- Name: idx_tags_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_organization_id ON public.tags USING btree (organization_id);


--
-- Name: idx_user_permissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: unique_primary_location_per_user_org; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_primary_location_per_user_org ON public.location_users USING btree (user_id, organization_id) WHERE (is_primary_location = true);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: sessions trigger_update_last_login; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER trigger_update_last_login AFTER INSERT ON auth.sessions FOR EACH ROW EXECUTE FUNCTION public.update_last_login();


--
-- Name: profiles cleanup_old_avatar_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cleanup_old_avatar_trigger AFTER UPDATE OF avatar_url ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.delete_old_avatar();


--
-- Name: profiles prevent_unauthorized_profile_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prevent_unauthorized_profile_changes BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_profile_update_permissions();

ALTER TABLE public.profiles DISABLE TRIGGER prevent_unauthorized_profile_changes;


--
-- Name: artworks trigger_log_artwork_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_artwork_update BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION public.log_artwork_update();


--
-- Name: tags trigger_log_status_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_log_status_history BEFORE UPDATE ON public.tags FOR EACH ROW WHEN ((old.active IS DISTINCT FROM new.active)) EXECUTE FUNCTION public.log_status_history();


--
-- Name: artworks trigger_set_deleted_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_deleted_fields BEFORE UPDATE ON public.artworks FOR EACH ROW WHEN (((old.deleted_at IS NULL) AND (new.deleted_at IS NOT NULL))) EXECUTE FUNCTION public.set_deleted_fields();


--
-- Name: artworks trigger_set_updated_by; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_updated_by BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();


--
-- Name: profiles trigger_update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: location_users update_location_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_location_users_updated_at BEFORE UPDATE ON public.location_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: locations update_locations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: appraisal_appraisers appraisal_appraisers_appraisal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_appraisers
    ADD CONSTRAINT appraisal_appraisers_appraisal_id_fkey FOREIGN KEY (appraisal_id) REFERENCES public.artwork_appraisals(id);


--
-- Name: appraisal_appraisers appraisal_appraisers_appraiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_appraisers
    ADD CONSTRAINT appraisal_appraisers_appraiser_id_fkey FOREIGN KEY (appraiser_id) REFERENCES public.artwork_appraisers(id) ON DELETE CASCADE;


--
-- Name: appraisal_appraisers appraisal_appraisers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_appraisers
    ADD CONSTRAINT appraisal_appraisers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: appraisal_appraisers appraisal_appraisers_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_appraisers
    ADD CONSTRAINT appraisal_appraisers_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: appraisal_appraisers appraisal_appraisers_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_appraisers
    ADD CONSTRAINT appraisal_appraisers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: artwork_appraisals artwork_appraisals_artwork_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisals
    ADD CONSTRAINT artwork_appraisals_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);


--
-- Name: artwork_appraisers artwork_appraiser_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisers
    ADD CONSTRAINT artwork_appraiser_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: artwork_appraisers artwork_appraiser_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisers
    ADD CONSTRAINT artwork_appraiser_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: artwork_appraisers artwork_appraiser_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisers
    ADD CONSTRAINT artwork_appraiser_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: artwork_appraisers artwork_appraiser_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisers
    ADD CONSTRAINT artwork_appraiser_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: artwork_appraisers artwork_appraisers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_appraisers
    ADD CONSTRAINT artwork_appraisers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: artwork_bibliography artwork_bibliography_artwork_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_bibliography
    ADD CONSTRAINT artwork_bibliography_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);


--
-- Name: artwork_bibliography artwork_bibliography_bibliography_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_bibliography
    ADD CONSTRAINT artwork_bibliography_bibliography_id_fkey FOREIGN KEY (bibliography_id) REFERENCES public.bibliography(id);


--
-- Name: artwork_bibliography artwork_bibliography_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_bibliography
    ADD CONSTRAINT artwork_bibliography_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: artwork_bibliography artwork_bibliography_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_bibliography
    ADD CONSTRAINT artwork_bibliography_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: artwork_bibliography artwork_bibliography_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_bibliography
    ADD CONSTRAINT artwork_bibliography_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: artwork_bibliography artwork_bibliography_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_bibliography
    ADD CONSTRAINT artwork_bibliography_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: artwork_collectors artwork_collectors_artwork_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_collectors
    ADD CONSTRAINT artwork_collectors_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);


--
-- Name: artwork_collectors artwork_collectors_collector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_collectors
    ADD CONSTRAINT artwork_collectors_collector_id_fkey FOREIGN KEY (collector_id) REFERENCES public.collectors(id);


--
-- Name: artwork_collectors artwork_collectors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_collectors
    ADD CONSTRAINT artwork_collectors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: artwork_collectors artwork_collectors_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_collectors
    ADD CONSTRAINT artwork_collectors_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: artwork_collectors artwork_collectors_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_collectors
    ADD CONSTRAINT artwork_collectors_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: artwork_collectors artwork_collectors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_collectors
    ADD CONSTRAINT artwork_collectors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: artwork_update_log artwork_update_log_artwork_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_update_log
    ADD CONSTRAINT artwork_update_log_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id) ON DELETE CASCADE;


--
-- Name: artwork_update_log artwork_update_log_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artwork_update_log
    ADD CONSTRAINT artwork_update_log_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: artworks artworks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: artworks artworks_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: artworks artworks_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: artworks artworks_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_owner_id_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: artworks artworks_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: artworks artworks_tag_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artworks
    ADD CONSTRAINT artworks_tag_issued_by_fkey FOREIGN KEY (tag_issued_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: assets assets_artwork_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id);


--
-- Name: bibliography bibliography_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bibliography
    ADD CONSTRAINT bibliography_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: bibliography bibliography_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bibliography
    ADD CONSTRAINT bibliography_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: bibliography bibliography_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bibliography
    ADD CONSTRAINT bibliography_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: bibliography bibliography_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bibliography
    ADD CONSTRAINT bibliography_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: collectors collectors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collectors
    ADD CONSTRAINT collectors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: collectors collectors_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collectors
    ADD CONSTRAINT collectors_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: collectors collectors_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collectors
    ADD CONSTRAINT collectors_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: collectors collectors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collectors
    ADD CONSTRAINT collectors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: cross_org_permissions cross_org_permissions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: cross_org_permissions cross_org_permissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: cross_org_permissions cross_org_permissions_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id);


--
-- Name: cross_org_permissions cross_org_permissions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: cross_org_permissions cross_org_permissions_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: cross_org_permissions cross_org_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cross_org_permissions
    ADD CONSTRAINT cross_org_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: location_users location_users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_users
    ADD CONSTRAINT location_users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: location_users location_users_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_users
    ADD CONSTRAINT location_users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: location_users location_users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_users
    ADD CONSTRAINT location_users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: location_users location_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_users
    ADD CONSTRAINT location_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: locations locations_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: locations locations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_users organization_users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: organization_users organization_users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id);


--
-- Name: organization_users organization_users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_users organization_users_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: organization_users organization_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: organizations organizations_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id);


--
-- Name: organizations organizations_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: profiles profiles_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: status_history status_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: status_history status_history_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: status_history status_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: tags tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: tags tags_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id);


--
-- Name: tags tags_deleted_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_deleted_by_fkey1 FOREIGN KEY (deleted_by) REFERENCES auth.users(id);


--
-- Name: tags tags_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: tags tags_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: tags tags_updated_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_updated_by_fkey1 FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: tags tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: user_permissions user_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id);


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: assets All - all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All - all" ON public.assets USING (true) WITH CHECK (true);


--
-- Name: artwork_bibliography Allow read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read" ON public.artwork_bibliography FOR SELECT USING (true);


--
-- Name: artwork_collectors Allow read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read" ON public.artwork_collectors FOR SELECT USING (true);


--
-- Name: bibliography Allow read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read" ON public.bibliography FOR SELECT USING (true);


--
-- Name: collectors Allow read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read" ON public.collectors FOR SELECT USING (true);


--
-- Name: artworks Allow read on non-deleted rows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read on non-deleted rows" ON public.artworks FOR SELECT USING ((deleted_at IS NULL));


--
-- Name: artworks Enable delete for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for all users" ON public.artworks FOR DELETE USING (true);


--
-- Name: appraisal_appraisers Enable delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for authenticated users" ON public.appraisal_appraisers FOR DELETE TO authenticated USING (true);


--
-- Name: artworks Enable insert for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for all users" ON public.artworks FOR INSERT WITH CHECK (true);


--
-- Name: tags Enable insert for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for all users" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: appraisal_appraisers Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.appraisal_appraisers FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: artwork_appraisals Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.artwork_appraisals FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: status_history Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.status_history FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: artwork_appraisers Enable insert for users based on user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for users based on user_id" ON public.artwork_appraisers FOR INSERT WITH CHECK (true);


--
-- Name: appraisal_appraisers Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.appraisal_appraisers FOR SELECT USING (true);


--
-- Name: artwork_appraisals Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.artwork_appraisals FOR SELECT USING (true);


--
-- Name: artwork_appraisers Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.artwork_appraisers FOR SELECT USING (true);


--
-- Name: artworks Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.artworks FOR SELECT USING (true);


--
-- Name: tags Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.tags FOR SELECT USING (true);


--
-- Name: role_permissions Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.role_permissions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: tags Enable to update for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable to update for all users" ON public.tags FOR UPDATE USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: artworks Enable update for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for all users" ON public.artworks FOR UPDATE USING (true);


--
-- Name: appraisal_appraisers Enable update for users based on email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users based on email" ON public.appraisal_appraisers FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artwork_appraisals Enable update for users based on email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users based on email" ON public.artwork_appraisals FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artwork_appraisers Enable update for users based on email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users based on email" ON public.artwork_appraisers FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: user_permissions Service role full access on user_permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on user_permissions" ON public.user_permissions USING ((current_setting('role'::text) = 'service_role'::text));


--
-- Name: user_sessions Service role full access on user_sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on user_sessions" ON public.user_sessions USING ((current_setting('role'::text) = 'service_role'::text));


--
-- Name: user_permissions Super users and admins can manage all permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super users and admins can manage all permissions" ON public.user_permissions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_user'::public.user_role_new, 'admin'::public.user_role_new])) AND (profiles.is_active = true)))));


--
-- Name: user_sessions Super users and admins can manage all sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super users and admins can manage all sessions" ON public.user_sessions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_user'::public.user_role_new, 'admin'::public.user_role_new])) AND (profiles.is_active = true)))));


--
-- Name: user_permissions Users can view their own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own permissions" ON public.user_permissions FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: user_sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: appraisal_appraisers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appraisal_appraisers ENABLE ROW LEVEL SECURITY;

--
-- Name: artwork_appraisals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artwork_appraisals ENABLE ROW LEVEL SECURITY;

--
-- Name: artwork_appraisers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artwork_appraisers ENABLE ROW LEVEL SECURITY;

--
-- Name: artwork_bibliography; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artwork_bibliography ENABLE ROW LEVEL SECURITY;

--
-- Name: artwork_collectors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artwork_collectors ENABLE ROW LEVEL SECURITY;

--
-- Name: artworks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: bibliography; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bibliography ENABLE ROW LEVEL SECURITY;

--
-- Name: collectors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;

--
-- Name: cross_org_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cross_org_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: location_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_users ENABLE ROW LEVEL SECURITY;

--
-- Name: location_users location_users_manager_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_users_manager_all ON public.location_users TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.locations l
  WHERE ((l.id = location_users.location_id) AND (l.manager_id = auth.uid())))));


--
-- Name: location_users location_users_org_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_users_org_admin_all ON public.location_users TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_users ou
  WHERE ((ou.user_id = auth.uid()) AND (ou.organization_id = location_users.organization_id) AND (ou.role = 'admin'::public.user_role_new) AND (ou.is_active = true)))));


--
-- Name: location_users location_users_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_users_self_select ON public.location_users FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: location_users location_users_super_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY location_users_super_admin_all ON public.location_users TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_user'::public.user_role_new)))));


--
-- Name: locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

--
-- Name: locations locations_manager_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY locations_manager_update ON public.locations FOR UPDATE TO authenticated USING ((manager_id = auth.uid()));


--
-- Name: locations locations_org_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY locations_org_admin_all ON public.locations TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_users ou
  WHERE ((ou.user_id = auth.uid()) AND (ou.organization_id = locations.organization_id) AND (ou.role = 'admin'::public.user_role_new) AND (ou.is_active = true)))));


--
-- Name: locations locations_org_users_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY locations_org_users_select ON public.locations FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_users ou
  WHERE ((ou.user_id = auth.uid()) AND (ou.organization_id = locations.organization_id) AND (ou.is_active = true) AND ((ou.permissions && ARRAY['view_all_locations'::text, 'manage_locations'::text]) OR (ou.role = ANY (ARRAY['admin'::public.user_role_new, 'staff'::public.user_role_new])))))));


--
-- Name: locations locations_super_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY locations_super_admin_all ON public.locations TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_user'::public.user_role_new)))));


--
-- Name: organization_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Allow authenticated users to delete artifacts; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to delete artifacts" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL)));


--
-- Name: objects Allow authenticated users to delete avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to delete avatars" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL)));


--
-- Name: objects Allow authenticated users to update artifacts; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to update artifacts" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL))) WITH CHECK (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL)));


--
-- Name: objects Allow authenticated users to update avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to update avatars" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL))) WITH CHECK (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL)));


--
-- Name: objects Allow authenticated users to upload artifacts; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to upload artifacts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL)));


--
-- Name: objects Allow authenticated users to upload avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL)));


--
-- Name: objects Allow public read access to artifacts; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow public read access to artifacts" ON storage.objects FOR SELECT USING ((bucket_id = 'artifacts'::text));


--
-- Name: objects Allow public read access to avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow public read access to avatars" ON storage.objects FOR SELECT USING ((bucket_id = 'user-avatars'::text));


--
-- Name: objects Allow service role to manage all artifacts; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow service role to manage all artifacts" ON storage.objects TO service_role USING ((bucket_id = 'artifacts'::text)) WITH CHECK ((bucket_id = 'artifacts'::text));


--
-- Name: objects Allow service role to manage all avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow service role to manage all avatars" ON storage.objects TO service_role USING ((bucket_id = 'user-avatars'::text)) WITH CHECK ((bucket_id = 'user-avatars'::text));


--
-- Name: objects Give access to a file to user 9akkwx_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give access to a file to user 9akkwx_0" ON storage.objects FOR SELECT USING (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


--
-- Name: objects Give access to a file to user 9akkwx_1; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give access to a file to user 9akkwx_1" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


--
-- Name: objects Give access to a file to user 9akkwx_2; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give access to a file to user 9akkwx_2" ON storage.objects FOR UPDATE USING (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


--
-- Name: objects Give access to a file to user 9akkwx_3; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give access to a file to user 9akkwx_3" ON storage.objects FOR DELETE USING (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


--
-- Name: objects Give anon users access to JPG images in folder 9akkwx_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give anon users access to JPG images in folder 9akkwx_0" ON storage.objects FOR SELECT USING (((bucket_id = 'artifacts'::text) AND (storage.extension(name) = 'jpg'::text) AND (lower((storage.foldername(name))[1]) = 'public'::text) AND (auth.role() = 'anon'::text)));


--
-- Name: objects Give users authenticated access to folder 9akkwx_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give users authenticated access to folder 9akkwx_0" ON storage.objects FOR SELECT USING (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Give users authenticated access to folder 9akkwx_1; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give users authenticated access to folder 9akkwx_1" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Give users authenticated access to folder 9akkwx_2; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give users authenticated access to folder 9akkwx_2" ON storage.objects FOR UPDATE USING (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Give users authenticated access to folder 9akkwx_3; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Give users authenticated access to folder 9akkwx_3" ON storage.objects FOR DELETE USING (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

