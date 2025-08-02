create schema if not exists "base32";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION base32.base32_alphabet(input integer)
 RETURNS character
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.base32_alphabet_to_decimal(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.base32_alphabet_to_decimal_int(input text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  alphabet text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  alpha int;
BEGIN
  alpha = position(input in alphabet) - 1;
  RETURN alpha;
END;
$function$
;

CREATE OR REPLACE FUNCTION base32.base32_to_decimal(input text)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.binary_to_int(input text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  i int;
  buf text;
BEGIN
    buf = 'SELECT B''' || input || '''::int';
    EXECUTE buf INTO i;
    RETURN i;
END;
$function$
;

CREATE OR REPLACE FUNCTION base32.decimal_to_chunks(input text[])
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.decode(input text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.encode(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.fill_chunks(input text[])
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.string_nchars(text, integer)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
AS $function$
SELECT ARRAY(SELECT substring($1 from n for $2)
  FROM generate_series(1, length($1), $2) n);
$function$
;

CREATE OR REPLACE FUNCTION base32.to_ascii(input text)
 RETURNS integer[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  i int;
  output int[];
BEGIN
  FOR i IN 1 .. character_length(input) LOOP
    output = array_append(output, ascii(substring(input from i for 1)));
  END LOOP;
  RETURN output;
END;
$function$
;

CREATE OR REPLACE FUNCTION base32.to_base32(input text[])
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.to_binary(input integer)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.to_binary(input integer[])
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  i int;
  output text[];
BEGIN
  FOR i IN 1 .. cardinality(input) LOOP
    output = array_append(output, base32.to_binary(input[i]));  
  END LOOP;
  RETURN output;
END;
$function$
;

CREATE OR REPLACE FUNCTION base32.to_chunks(input text[])
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  i int;
  output text[];
  str text;
  len int = cardinality(input);
BEGIN
  RETURN base32.string_nchars(array_to_string(input, ''), 5);
END;
$function$
;

CREATE OR REPLACE FUNCTION base32.to_decimal(input text[])
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.to_groups(input text[])
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION base32.valid(input text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN 
  IF (upper(input) ~* '^[A-Z2-7]+=*$') THEN 
    RETURN true;
  END IF;
  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION base32.zero_fill(a integer, b integer)
 RETURNS bigint
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;


drop policy "Authenticated users can view artworks" on "public"."artworks";

drop policy "Authenticated users can view assets" on "public"."assets";

drop policy "admins_can_delete_org_members" on "public"."organization_users";

drop policy "admins_can_insert_org_members" on "public"."organization_users";

drop policy "admins_can_update_org_members" on "public"."organization_users";

drop policy "Users can update own profile" on "public"."profiles";

drop policy "Users can view own profile" on "public"."profiles";

drop policy "Authenticated users can view tags" on "public"."tags";

drop policy "authenticated_can_view_active_org_members" on "public"."organization_users";

revoke delete on table "public"."artwork_appraisers" from "anon";

revoke insert on table "public"."artwork_appraisers" from "anon";

revoke references on table "public"."artwork_appraisers" from "anon";

revoke select on table "public"."artwork_appraisers" from "anon";

revoke trigger on table "public"."artwork_appraisers" from "anon";

revoke truncate on table "public"."artwork_appraisers" from "anon";

revoke update on table "public"."artwork_appraisers" from "anon";

revoke delete on table "public"."artwork_appraisers" from "authenticated";

revoke insert on table "public"."artwork_appraisers" from "authenticated";

revoke references on table "public"."artwork_appraisers" from "authenticated";

revoke select on table "public"."artwork_appraisers" from "authenticated";

revoke trigger on table "public"."artwork_appraisers" from "authenticated";

revoke truncate on table "public"."artwork_appraisers" from "authenticated";

revoke update on table "public"."artwork_appraisers" from "authenticated";

revoke delete on table "public"."artwork_appraisers" from "service_role";

revoke insert on table "public"."artwork_appraisers" from "service_role";

revoke references on table "public"."artwork_appraisers" from "service_role";

revoke select on table "public"."artwork_appraisers" from "service_role";

revoke trigger on table "public"."artwork_appraisers" from "service_role";

revoke truncate on table "public"."artwork_appraisers" from "service_role";

revoke update on table "public"."artwork_appraisers" from "service_role";

revoke delete on table "public"."artworks" from "anon";

revoke insert on table "public"."artworks" from "anon";

revoke references on table "public"."artworks" from "anon";

revoke select on table "public"."artworks" from "anon";

revoke trigger on table "public"."artworks" from "anon";

revoke truncate on table "public"."artworks" from "anon";

revoke update on table "public"."artworks" from "anon";

revoke delete on table "public"."artworks" from "authenticated";

revoke insert on table "public"."artworks" from "authenticated";

revoke references on table "public"."artworks" from "authenticated";

revoke select on table "public"."artworks" from "authenticated";

revoke trigger on table "public"."artworks" from "authenticated";

revoke truncate on table "public"."artworks" from "authenticated";

revoke update on table "public"."artworks" from "authenticated";

revoke delete on table "public"."artworks" from "service_role";

revoke insert on table "public"."artworks" from "service_role";

revoke references on table "public"."artworks" from "service_role";

revoke select on table "public"."artworks" from "service_role";

revoke trigger on table "public"."artworks" from "service_role";

revoke truncate on table "public"."artworks" from "service_role";

revoke update on table "public"."artworks" from "service_role";

revoke delete on table "public"."assets" from "anon";

revoke insert on table "public"."assets" from "anon";

revoke references on table "public"."assets" from "anon";

revoke select on table "public"."assets" from "anon";

revoke trigger on table "public"."assets" from "anon";

revoke truncate on table "public"."assets" from "anon";

revoke update on table "public"."assets" from "anon";

revoke delete on table "public"."assets" from "authenticated";

revoke insert on table "public"."assets" from "authenticated";

revoke references on table "public"."assets" from "authenticated";

revoke select on table "public"."assets" from "authenticated";

revoke trigger on table "public"."assets" from "authenticated";

revoke truncate on table "public"."assets" from "authenticated";

revoke update on table "public"."assets" from "authenticated";

revoke delete on table "public"."assets" from "service_role";

revoke insert on table "public"."assets" from "service_role";

revoke references on table "public"."assets" from "service_role";

revoke select on table "public"."assets" from "service_role";

revoke trigger on table "public"."assets" from "service_role";

revoke truncate on table "public"."assets" from "service_role";

revoke update on table "public"."assets" from "service_role";

revoke delete on table "public"."cross_org_permissions" from "anon";

revoke insert on table "public"."cross_org_permissions" from "anon";

revoke references on table "public"."cross_org_permissions" from "anon";

revoke select on table "public"."cross_org_permissions" from "anon";

revoke trigger on table "public"."cross_org_permissions" from "anon";

revoke truncate on table "public"."cross_org_permissions" from "anon";

revoke update on table "public"."cross_org_permissions" from "anon";

revoke delete on table "public"."cross_org_permissions" from "authenticated";

revoke insert on table "public"."cross_org_permissions" from "authenticated";

revoke references on table "public"."cross_org_permissions" from "authenticated";

revoke select on table "public"."cross_org_permissions" from "authenticated";

revoke trigger on table "public"."cross_org_permissions" from "authenticated";

revoke truncate on table "public"."cross_org_permissions" from "authenticated";

revoke update on table "public"."cross_org_permissions" from "authenticated";

revoke delete on table "public"."cross_org_permissions" from "service_role";

revoke insert on table "public"."cross_org_permissions" from "service_role";

revoke references on table "public"."cross_org_permissions" from "service_role";

revoke select on table "public"."cross_org_permissions" from "service_role";

revoke trigger on table "public"."cross_org_permissions" from "service_role";

revoke truncate on table "public"."cross_org_permissions" from "service_role";

revoke update on table "public"."cross_org_permissions" from "service_role";

revoke delete on table "public"."organization_users" from "anon";

revoke insert on table "public"."organization_users" from "anon";

revoke references on table "public"."organization_users" from "anon";

revoke select on table "public"."organization_users" from "anon";

revoke trigger on table "public"."organization_users" from "anon";

revoke truncate on table "public"."organization_users" from "anon";

revoke update on table "public"."organization_users" from "anon";

revoke delete on table "public"."organization_users" from "authenticated";

revoke insert on table "public"."organization_users" from "authenticated";

revoke references on table "public"."organization_users" from "authenticated";

revoke select on table "public"."organization_users" from "authenticated";

revoke trigger on table "public"."organization_users" from "authenticated";

revoke truncate on table "public"."organization_users" from "authenticated";

revoke update on table "public"."organization_users" from "authenticated";

revoke delete on table "public"."organization_users" from "service_role";

revoke insert on table "public"."organization_users" from "service_role";

revoke references on table "public"."organization_users" from "service_role";

revoke select on table "public"."organization_users" from "service_role";

revoke trigger on table "public"."organization_users" from "service_role";

revoke truncate on table "public"."organization_users" from "service_role";

revoke update on table "public"."organization_users" from "service_role";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke delete on table "public"."organizations" from "authenticated";

revoke insert on table "public"."organizations" from "authenticated";

revoke references on table "public"."organizations" from "authenticated";

revoke select on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke update on table "public"."organizations" from "authenticated";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."role_permissions" from "anon";

revoke insert on table "public"."role_permissions" from "anon";

revoke references on table "public"."role_permissions" from "anon";

revoke select on table "public"."role_permissions" from "anon";

revoke trigger on table "public"."role_permissions" from "anon";

revoke truncate on table "public"."role_permissions" from "anon";

revoke update on table "public"."role_permissions" from "anon";

revoke delete on table "public"."role_permissions" from "authenticated";

revoke insert on table "public"."role_permissions" from "authenticated";

revoke references on table "public"."role_permissions" from "authenticated";

revoke select on table "public"."role_permissions" from "authenticated";

revoke trigger on table "public"."role_permissions" from "authenticated";

revoke truncate on table "public"."role_permissions" from "authenticated";

revoke update on table "public"."role_permissions" from "authenticated";

revoke delete on table "public"."role_permissions" from "service_role";

revoke insert on table "public"."role_permissions" from "service_role";

revoke references on table "public"."role_permissions" from "service_role";

revoke select on table "public"."role_permissions" from "service_role";

revoke trigger on table "public"."role_permissions" from "service_role";

revoke truncate on table "public"."role_permissions" from "service_role";

revoke update on table "public"."role_permissions" from "service_role";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke delete on table "public"."tags" from "authenticated";

revoke insert on table "public"."tags" from "authenticated";

revoke references on table "public"."tags" from "authenticated";

revoke select on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke update on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

revoke delete on table "public"."user_permissions" from "anon";

revoke insert on table "public"."user_permissions" from "anon";

revoke references on table "public"."user_permissions" from "anon";

revoke select on table "public"."user_permissions" from "anon";

revoke trigger on table "public"."user_permissions" from "anon";

revoke truncate on table "public"."user_permissions" from "anon";

revoke update on table "public"."user_permissions" from "anon";

revoke delete on table "public"."user_permissions" from "authenticated";

revoke insert on table "public"."user_permissions" from "authenticated";

revoke references on table "public"."user_permissions" from "authenticated";

revoke select on table "public"."user_permissions" from "authenticated";

revoke trigger on table "public"."user_permissions" from "authenticated";

revoke truncate on table "public"."user_permissions" from "authenticated";

revoke update on table "public"."user_permissions" from "authenticated";

revoke delete on table "public"."user_permissions" from "service_role";

revoke insert on table "public"."user_permissions" from "service_role";

revoke references on table "public"."user_permissions" from "service_role";

revoke select on table "public"."user_permissions" from "service_role";

revoke trigger on table "public"."user_permissions" from "service_role";

revoke truncate on table "public"."user_permissions" from "service_role";

revoke update on table "public"."user_permissions" from "service_role";

revoke delete on table "public"."user_sessions" from "anon";

revoke insert on table "public"."user_sessions" from "anon";

revoke references on table "public"."user_sessions" from "anon";

revoke select on table "public"."user_sessions" from "anon";

revoke trigger on table "public"."user_sessions" from "anon";

revoke truncate on table "public"."user_sessions" from "anon";

revoke update on table "public"."user_sessions" from "anon";

revoke delete on table "public"."user_sessions" from "authenticated";

revoke insert on table "public"."user_sessions" from "authenticated";

revoke references on table "public"."user_sessions" from "authenticated";

revoke select on table "public"."user_sessions" from "authenticated";

revoke trigger on table "public"."user_sessions" from "authenticated";

revoke truncate on table "public"."user_sessions" from "authenticated";

revoke update on table "public"."user_sessions" from "authenticated";

revoke delete on table "public"."user_sessions" from "service_role";

revoke insert on table "public"."user_sessions" from "service_role";

revoke references on table "public"."user_sessions" from "service_role";

revoke select on table "public"."user_sessions" from "service_role";

revoke trigger on table "public"."user_sessions" from "service_role";

revoke truncate on table "public"."user_sessions" from "service_role";

revoke update on table "public"."user_sessions" from "service_role";

alter table "public"."artwork_appraisers" drop constraint "artwork_appraisers_artwork_id_fkey";

alter table "public"."artwork_appraisers" drop constraint "artwork_appraisers_created_by_fkey";

alter table "public"."artworks" drop constraint "artworks_id_number_key";

alter table "public"."tags" drop constraint "tags_tag_id_key";

alter table "public"."tags" drop constraint "tags_tag_issued_by_fkey";

alter table "public"."artworks" drop constraint "artworks_created_by_fkey";

alter table "public"."artworks" drop constraint "artworks_tag_id_fkey";

alter table "public"."assets" drop constraint "assets_artwork_id_fkey";

alter table "public"."profiles" drop constraint "profiles_created_by_fkey";

alter table "public"."profiles" drop constraint "profiles_deleted_by_fkey";

alter table "public"."profiles" drop constraint "profiles_updated_by_fkey";

alter table "public"."tags" drop constraint "tags_updated_by_fkey";

drop function if exists "public"."add_user_to_organization"(p_user_id uuid, p_organization_id uuid, p_role text, p_permissions text[], p_is_primary boolean);

drop function if exists "public"."update_organization_membership"(p_membership_id uuid, p_role text, p_permissions text[], p_is_active boolean);

drop function if exists "public"."add_artwork"(p_idnumber text, p_title text, p_description text, p_height double precision, p_width double precision, p_size_unit text, p_artist text, p_year text, p_medium text, p_tag_id text, p_expiration_date date, p_read_write_count bigint, p_assets jsonb, p_provenance text, p_bibliography jsonb, p_collectors jsonb, p_organization_id uuid);

drop view if exists "public"."current_user_profile";

drop view if exists "public"."profiles_view";

alter table "public"."artwork_appraisers" drop constraint "artwork_appraisers_pkey";

drop index if exists "public"."artwork_appraisers_pkey";

drop index if exists "public"."artworks_id_number_key";

drop index if exists "public"."idx_artworks_artist";

drop index if exists "public"."idx_artworks_tag_id";

drop index if exists "public"."idx_assets_artwork_id";

drop index if exists "public"."idx_profiles_active";

drop index if exists "public"."idx_tags_active";

drop index if exists "public"."idx_tags_tag_id";

drop index if exists "public"."tags_tag_id_key";

create table "public"."appraisal_appraisers" (
    "id" uuid not null default gen_random_uuid(),
    "appraisal_id" uuid,
    "appraiser_id" uuid,
    "created_at" timestamp without time zone,
    "created_by" uuid,
    "updated_at" timestamp without time zone,
    "updated_by" uuid,
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid
);


alter table "public"."appraisal_appraisers" enable row level security;

create table "public"."artwork_appraisals" (
    "id" uuid not null default gen_random_uuid(),
    "condition" text,
    "acquisition_cost" numeric,
    "appraised_value" numeric,
    "artist_info" text,
    "recent_auction_references" text[],
    "notes" text,
    "recommendation" text,
    "appraisal_date" date,
    "created_at" timestamp with time zone default now(),
    "created_by" uuid,
    "updated_at" timestamp with time zone,
    "updated_by" uuid,
    "deleted_at" timestamp with time zone,
    "deleted_by" uuid,
    "artwork_id" uuid
);


alter table "public"."artwork_appraisals" enable row level security;

create table "public"."artwork_bibliography" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "artwork_id" uuid not null default gen_random_uuid(),
    "bibliography_id" uuid not null default gen_random_uuid(),
    "created_by" uuid,
    "updated_at" timestamp without time zone,
    "updated_by" uuid,
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid,
    "user_id" uuid
);


alter table "public"."artwork_bibliography" enable row level security;

create table "public"."artwork_collectors" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "artwork_id" uuid default gen_random_uuid(),
    "collector_id" uuid default gen_random_uuid(),
    "created_by" uuid default gen_random_uuid(),
    "updated_at" timestamp without time zone,
    "updated_by" uuid default gen_random_uuid(),
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid default gen_random_uuid(),
    "user_id" uuid default gen_random_uuid()
);


alter table "public"."artwork_collectors" enable row level security;

create table "public"."artwork_update_log" (
    "id" uuid not null default gen_random_uuid(),
    "artwork_id" uuid not null,
    "updated_by" uuid,
    "updated_at" timestamp with time zone default now(),
    "old_data" jsonb,
    "new_data" jsonb,
    "changes" jsonb,
    "created_at" timestamp with time zone default now()
);


create table "public"."bibliography" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "description" character varying,
    "created_by" uuid default gen_random_uuid(),
    "updated_at" timestamp without time zone,
    "updated_by" uuid default gen_random_uuid(),
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid default gen_random_uuid(),
    "user_id" uuid default gen_random_uuid()
);


alter table "public"."bibliography" enable row level security;

create table "public"."collectors" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "description" character varying,
    "created_by" uuid default gen_random_uuid(),
    "updated_at" timestamp without time zone,
    "updated_by" uuid default gen_random_uuid(),
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid default gen_random_uuid(),
    "user_id" uuid default gen_random_uuid()
);


alter table "public"."collectors" enable row level security;

create table "public"."favorites" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "artwork_id" uuid,
    "created_at" timestamp with time zone default now()
);


create table "public"."location_users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "location_id" uuid not null,
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "role" user_role not null default 'staff'::user_role,
    "permissions" text[] default '{}'::text[],
    "is_primary_location" boolean default false,
    "can_access_other_locations" boolean default false,
    "department" character varying(100),
    "position" character varying(100),
    "employee_id" character varying(50),
    "is_active" boolean default true,
    "start_date" date default CURRENT_DATE,
    "end_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid,
    "deleted_at" timestamp with time zone
);


alter table "public"."location_users" enable row level security;

create table "public"."locations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "organization_id" uuid not null,
    "name" character varying(255) not null,
    "code" character varying(50),
    "description" text,
    "address" jsonb default '{}'::jsonb,
    "street" character varying(255),
    "city" character varying(100),
    "state" character varying(100),
    "country" character varying(100),
    "postal_code" character varying(20),
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "phone" character varying(50),
    "email" character varying(255),
    "manager_id" uuid,
    "settings" jsonb default '{}'::jsonb,
    "is_headquarters" boolean default false,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone
);


alter table "public"."locations" enable row level security;

create table "public"."status_history" (
    "id" uuid not null default gen_random_uuid(),
    "tag_id" text not null,
    "status" boolean not null,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid default gen_random_uuid(),
    "updated_at" timestamp without time zone,
    "updated_by" uuid default gen_random_uuid(),
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid,
    "user_id" uuid
);


alter table "public"."status_history" enable row level security;

alter table "public"."artwork_appraisers" drop column "appraisal_date";

alter table "public"."artwork_appraisers" drop column "appraisal_type";

alter table "public"."artwork_appraisers" drop column "appraiser_name";

alter table "public"."artwork_appraisers" drop column "artwork_id";

alter table "public"."artwork_appraisers" drop column "currency";

alter table "public"."artwork_appraisers" drop column "current_value";

alter table "public"."artwork_appraisers" drop column "document_url";

alter table "public"."artwork_appraisers" drop column "notes";

alter table "public"."artwork_appraisers" add column "deleted_at" timestamp without time zone;

alter table "public"."artwork_appraisers" add column "deleted_by" uuid;

alter table "public"."artwork_appraisers" add column "name" text not null;

alter table "public"."artwork_appraisers" add column "organization" text;

alter table "public"."artwork_appraisers" add column "updated_by" uuid;

alter table "public"."artwork_appraisers" add column "user_id" uuid;

alter table "public"."artwork_appraisers" alter column "created_at" set not null;

alter table "public"."artwork_appraisers" alter column "updated_at" drop default;

alter table "public"."artwork_appraisers" alter column "updated_at" set data type timestamp without time zone using "updated_at"::timestamp without time zone;

alter table "public"."artworks" drop column "expirationdate";

alter table "public"."artworks" drop column "readwritecount";

alter table "public"."artworks" drop column "sizeunit";

alter table "public"."artworks" add column "deleted_at" timestamp with time zone;

alter table "public"."artworks" add column "deleted_by" uuid;

alter table "public"."artworks" add column "location_id" uuid;

alter table "public"."artworks" add column "read_write_count" bigint;

alter table "public"."artworks" add column "size_unit" text;

alter table "public"."artworks" add column "tag_issued_at" timestamp without time zone;

alter table "public"."artworks" add column "tag_issued_by" uuid default auth.uid();

alter table "public"."artworks" add column "updated_by" uuid;

-- Skip bibliography column changes as it's already text[] type in the base schema
-- alter table "public"."artworks" alter column "bibliography" set default '[]'::jsonb;
-- alter table "public"."artworks" alter column "bibliography" set data type jsonb using "bibliography"::jsonb;

-- Skip collectors column changes as it's already text[] type in the base schema
-- alter table "public"."artworks" alter column "collectors" set default '[]'::jsonb;
-- alter table "public"."artworks" alter column "collectors" set data type jsonb using "collectors"::jsonb;

alter table "public"."artworks" alter column "created_at" set default (now() AT TIME ZONE 'utc'::text);

alter table "public"."artworks" alter column "created_at" set data type timestamp without time zone using "created_at"::timestamp without time zone;

alter table "public"."artworks" alter column "created_by" set default auth.uid();

alter table "public"."artworks" alter column "description" set not null;

alter table "public"."artworks" alter column "height" set data type double precision using "height"::double precision;

alter table "public"."artworks" alter column "id_number" drop not null;

alter table "public"."artworks" alter column "tag_id" set data type text using "tag_id"::text;

alter table "public"."artworks" alter column "updated_at" drop default;

alter table "public"."artworks" alter column "updated_at" set data type timestamp without time zone using "updated_at"::timestamp without time zone;

alter table "public"."artworks" alter column "width" set data type double precision using "width"::double precision;

alter table "public"."artworks" alter column "year" set not null;

alter table "public"."artworks" alter column "year" set data type text using "year"::text;

alter table "public"."assets" add column "updated_at" timestamp without time zone;

alter table "public"."assets" alter column "created_at" set data type timestamp without time zone using "created_at"::timestamp without time zone;

alter table "public"."assets" alter column "filename" drop not null;

alter table "public"."assets" alter column "sort_order" set default '0'::bigint;

alter table "public"."assets" alter column "sort_order" set data type bigint using "sort_order"::bigint;

alter table "public"."assets" alter column "url" drop not null;

alter table "public"."organization_users" disable row level security;

alter table "public"."profiles" drop column "permissions";

alter table "public"."profiles" add column "last_login_at" timestamp with time zone;

alter table "public"."profiles" disable row level security;

alter table "public"."tags" drop column "issue_date";

alter table "public"."tags" drop column "tag_id";

alter table "public"."tags" drop column "tag_issued_by";

alter table "public"."tags" drop column "write_count";

alter table "public"."tags" add column "created_by" uuid default auth.uid();

alter table "public"."tags" add column "deleted_at" timestamp without time zone;

alter table "public"."tags" add column "deleted_by" uuid;

alter table "public"."tags" add column "read_write_count" bigint not null default '0'::bigint;

alter table "public"."tags" add column "user_id" uuid;

alter table "public"."tags" alter column "active" set not null;

alter table "public"."tags" alter column "created_at" set data type timestamp without time zone using "created_at"::timestamp without time zone;

alter table "public"."tags" alter column "expiration_date" set data type date using "expiration_date"::date;

alter table "public"."tags" alter column "id" drop default;

alter table "public"."tags" alter column "id" set data type text using "id"::text;

alter table "public"."tags" alter column "updated_at" drop default;

alter table "public"."tags" alter column "updated_at" set data type timestamp without time zone using "updated_at"::timestamp without time zone;

alter table "public"."user_permissions" add column "granted_by" uuid;

alter table "public"."user_permissions" add column "updated_at" timestamp with time zone default now();

alter table "public"."user_sessions" add column "ip_address" inet;

alter table "public"."user_sessions" add column "is_active" boolean default true;

alter table "public"."user_sessions" add column "last_activity_at" timestamp with time zone default now();

alter table "public"."user_sessions" add column "session_token" text;

alter table "public"."user_sessions" add column "user_agent" text;

CREATE UNIQUE INDEX appraisal_appraisers_pkey ON public.appraisal_appraisers USING btree (id);

CREATE UNIQUE INDEX art_appraiser_pkey ON public.artwork_appraisers USING btree (id);

CREATE UNIQUE INDEX artwork_appraisals_pkey ON public.artwork_appraisals USING btree (id);

CREATE UNIQUE INDEX artwork_appraisers_name_key ON public.artwork_appraisers USING btree (name);

CREATE UNIQUE INDEX artwork_bibliography_pkey ON public.artwork_bibliography USING btree (id);

CREATE UNIQUE INDEX artwork_collectors_pkey ON public.artwork_collectors USING btree (id);

CREATE UNIQUE INDEX artwork_update_log_pkey ON public.artwork_update_log USING btree (id);

CREATE UNIQUE INDEX artworks_tag_id_key ON public.artworks USING btree (tag_id);

CREATE UNIQUE INDEX bibliography_pkey ON public.bibliography USING btree (id);

CREATE UNIQUE INDEX collectors_pkey ON public.collectors USING btree (id);

CREATE UNIQUE INDEX favorites_pkey ON public.favorites USING btree (id);

CREATE INDEX idx_artworks_location_id ON public.artworks USING btree (location_id);

CREATE INDEX idx_location_users_is_active ON public.location_users USING btree (is_active);

CREATE INDEX idx_location_users_location_id ON public.location_users USING btree (location_id);

CREATE INDEX idx_location_users_organization_id ON public.location_users USING btree (organization_id);

CREATE INDEX idx_location_users_user_id ON public.location_users USING btree (user_id);

CREATE INDEX idx_locations_is_active ON public.locations USING btree (is_active);

CREATE INDEX idx_locations_manager_id ON public.locations USING btree (manager_id);

CREATE INDEX idx_locations_organization_id ON public.locations USING btree (organization_id);

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_deleted_at ON public.profiles USING btree (deleted_at);

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);

CREATE UNIQUE INDEX location_users_pkey ON public.location_users USING btree (id);

CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id);

CREATE UNIQUE INDEX status_history_pkey ON public.status_history USING btree (id);

CREATE UNIQUE INDEX unique_location_code_per_org ON public.locations USING btree (organization_id, code);

CREATE UNIQUE INDEX unique_location_name_per_org ON public.locations USING btree (organization_id, name);

CREATE UNIQUE INDEX unique_primary_location_per_user_org ON public.location_users USING btree (user_id, organization_id) WHERE (is_primary_location = true);

CREATE UNIQUE INDEX unique_user_location ON public.location_users USING btree (location_id, user_id);

CREATE UNIQUE INDEX user_permissions_user_id_permission_key ON public.user_permissions USING btree (user_id, permission);

alter table "public"."appraisal_appraisers" add constraint "appraisal_appraisers_pkey" PRIMARY KEY using index "appraisal_appraisers_pkey";

alter table "public"."artwork_appraisals" add constraint "artwork_appraisals_pkey" PRIMARY KEY using index "artwork_appraisals_pkey";

alter table "public"."artwork_appraisers" add constraint "art_appraiser_pkey" PRIMARY KEY using index "art_appraiser_pkey";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_pkey" PRIMARY KEY using index "artwork_bibliography_pkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_pkey" PRIMARY KEY using index "artwork_collectors_pkey";

alter table "public"."artwork_update_log" add constraint "artwork_update_log_pkey" PRIMARY KEY using index "artwork_update_log_pkey";

alter table "public"."bibliography" add constraint "bibliography_pkey" PRIMARY KEY using index "bibliography_pkey";

alter table "public"."collectors" add constraint "collectors_pkey" PRIMARY KEY using index "collectors_pkey";

alter table "public"."favorites" add constraint "favorites_pkey" PRIMARY KEY using index "favorites_pkey";

alter table "public"."location_users" add constraint "location_users_pkey" PRIMARY KEY using index "location_users_pkey";

alter table "public"."locations" add constraint "locations_pkey" PRIMARY KEY using index "locations_pkey";

alter table "public"."status_history" add constraint "status_history_pkey" PRIMARY KEY using index "status_history_pkey";

alter table "public"."appraisal_appraisers" add constraint "appraisal_appraisers_appraisal_id_fkey" FOREIGN KEY (appraisal_id) REFERENCES artwork_appraisals(id) not valid;

alter table "public"."appraisal_appraisers" validate constraint "appraisal_appraisers_appraisal_id_fkey";

alter table "public"."appraisal_appraisers" add constraint "appraisal_appraisers_appraiser_id_fkey" FOREIGN KEY (appraiser_id) REFERENCES artwork_appraisers(id) ON DELETE CASCADE not valid;

alter table "public"."appraisal_appraisers" validate constraint "appraisal_appraisers_appraiser_id_fkey";

alter table "public"."appraisal_appraisers" add constraint "appraisal_appraisers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."appraisal_appraisers" validate constraint "appraisal_appraisers_created_by_fkey";

alter table "public"."appraisal_appraisers" add constraint "appraisal_appraisers_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) not valid;

alter table "public"."appraisal_appraisers" validate constraint "appraisal_appraisers_deleted_by_fkey";

alter table "public"."appraisal_appraisers" add constraint "appraisal_appraisers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."appraisal_appraisers" validate constraint "appraisal_appraisers_updated_by_fkey";

alter table "public"."artwork_appraisals" add constraint "artwork_appraisals_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES artworks(id) not valid;

alter table "public"."artwork_appraisals" validate constraint "artwork_appraisals_artwork_id_fkey";

alter table "public"."artwork_appraisers" add constraint "artwork_appraiser_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_appraisers" validate constraint "artwork_appraiser_created_by_fkey";

alter table "public"."artwork_appraisers" add constraint "artwork_appraiser_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_appraisers" validate constraint "artwork_appraiser_deleted_by_fkey";

alter table "public"."artwork_appraisers" add constraint "artwork_appraiser_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_appraisers" validate constraint "artwork_appraiser_updated_by_fkey";

alter table "public"."artwork_appraisers" add constraint "artwork_appraiser_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."artwork_appraisers" validate constraint "artwork_appraiser_user_id_fkey";

alter table "public"."artwork_appraisers" add constraint "artwork_appraisers_name_key" UNIQUE using index "artwork_appraisers_name_key";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES artworks(id) not valid;

alter table "public"."artwork_bibliography" validate constraint "artwork_bibliography_artwork_id_fkey";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_bibliography_id_fkey" FOREIGN KEY (bibliography_id) REFERENCES bibliography(id) not valid;

alter table "public"."artwork_bibliography" validate constraint "artwork_bibliography_bibliography_id_fkey";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_bibliography" validate constraint "artwork_bibliography_created_by_fkey";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_bibliography" validate constraint "artwork_bibliography_deleted_by_fkey";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_bibliography" validate constraint "artwork_bibliography_updated_by_fkey";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."artwork_bibliography" validate constraint "artwork_bibliography_user_id_fkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES artworks(id) not valid;

alter table "public"."artwork_collectors" validate constraint "artwork_collectors_artwork_id_fkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_collector_id_fkey" FOREIGN KEY (collector_id) REFERENCES collectors(id) not valid;

alter table "public"."artwork_collectors" validate constraint "artwork_collectors_collector_id_fkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_collectors" validate constraint "artwork_collectors_created_by_fkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_collectors" validate constraint "artwork_collectors_deleted_by_fkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_collectors" validate constraint "artwork_collectors_updated_by_fkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."artwork_collectors" validate constraint "artwork_collectors_user_id_fkey";

alter table "public"."artwork_update_log" add constraint "artwork_update_log_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE not valid;

alter table "public"."artwork_update_log" validate constraint "artwork_update_log_artwork_id_fkey";

alter table "public"."artwork_update_log" add constraint "artwork_update_log_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."artwork_update_log" validate constraint "artwork_update_log_updated_by_fkey";

alter table "public"."artworks" add constraint "artworks_location_id_fkey" FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL not valid;

alter table "public"."artworks" validate constraint "artworks_location_id_fkey";

alter table "public"."artworks" add constraint "artworks_owner_id_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."artworks" validate constraint "artworks_owner_id_fkey";

alter table "public"."artworks" add constraint "artworks_tag_id_key" UNIQUE using index "artworks_tag_id_key";

alter table "public"."artworks" add constraint "artworks_tag_issued_by_fkey" FOREIGN KEY (tag_issued_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."artworks" validate constraint "artworks_tag_issued_by_fkey";

alter table "public"."bibliography" add constraint "bibliography_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."bibliography" validate constraint "bibliography_created_by_fkey";

alter table "public"."bibliography" add constraint "bibliography_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) not valid;

alter table "public"."bibliography" validate constraint "bibliography_deleted_by_fkey";

alter table "public"."bibliography" add constraint "bibliography_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."bibliography" validate constraint "bibliography_updated_by_fkey";

alter table "public"."bibliography" add constraint "bibliography_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."bibliography" validate constraint "bibliography_user_id_fkey";

alter table "public"."collectors" add constraint "collectors_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."collectors" validate constraint "collectors_created_by_fkey";

alter table "public"."collectors" add constraint "collectors_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) not valid;

alter table "public"."collectors" validate constraint "collectors_deleted_by_fkey";

alter table "public"."collectors" add constraint "collectors_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."collectors" validate constraint "collectors_updated_by_fkey";

alter table "public"."collectors" add constraint "collectors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."collectors" validate constraint "collectors_user_id_fkey";

alter table "public"."favorites" add constraint "favorites_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_artwork_id_fkey";

alter table "public"."favorites" add constraint "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_user_id_fkey";

alter table "public"."location_users" add constraint "location_users_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."location_users" validate constraint "location_users_created_by_fkey";

alter table "public"."location_users" add constraint "location_users_location_id_fkey" FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE not valid;

alter table "public"."location_users" validate constraint "location_users_location_id_fkey";

alter table "public"."location_users" add constraint "location_users_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."location_users" validate constraint "location_users_organization_id_fkey";

alter table "public"."location_users" add constraint "location_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."location_users" validate constraint "location_users_user_id_fkey";

alter table "public"."location_users" add constraint "unique_user_location" UNIQUE using index "unique_user_location";

alter table "public"."locations" add constraint "locations_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."locations" validate constraint "locations_manager_id_fkey";

alter table "public"."locations" add constraint "locations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."locations" validate constraint "locations_organization_id_fkey";

alter table "public"."locations" add constraint "unique_location_code_per_org" UNIQUE using index "unique_location_code_per_org";

alter table "public"."locations" add constraint "unique_location_name_per_org" UNIQUE using index "unique_location_name_per_org";

alter table "public"."status_history" add constraint "status_history_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."status_history" validate constraint "status_history_created_by_fkey";

alter table "public"."status_history" add constraint "status_history_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."status_history" validate constraint "status_history_updated_by_fkey";

alter table "public"."status_history" add constraint "status_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."status_history" validate constraint "status_history_user_id_fkey";

alter table "public"."tags" add constraint "tags_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."tags" validate constraint "tags_created_by_fkey";

alter table "public"."tags" add constraint "tags_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES profiles(id) not valid;

alter table "public"."tags" validate constraint "tags_deleted_by_fkey";

alter table "public"."tags" add constraint "tags_deleted_by_fkey1" FOREIGN KEY (deleted_by) REFERENCES auth.users(id) not valid;

alter table "public"."tags" validate constraint "tags_deleted_by_fkey1";

alter table "public"."tags" add constraint "tags_updated_by_fkey1" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."tags" validate constraint "tags_updated_by_fkey1";

alter table "public"."tags" add constraint "tags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."tags" validate constraint "tags_user_id_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_granted_by_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_user_id_permission_key" UNIQUE using index "user_permissions_user_id_permission_key";

alter table "public"."artworks" add constraint "artworks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."artworks" validate constraint "artworks_created_by_fkey";

alter table "public"."artworks" add constraint "artworks_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."artworks" validate constraint "artworks_tag_id_fkey";

alter table "public"."assets" add constraint "assets_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES artworks(id) not valid;

alter table "public"."assets" validate constraint "assets_artwork_id_fkey";

alter table "public"."profiles" add constraint "profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_deleted_by_fkey";

alter table "public"."profiles" add constraint "profiles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_updated_by_fkey";

alter table "public"."tags" add constraint "tags_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."tags" validate constraint "tags_updated_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_favorite(user_id uuid, artwork_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
INSERT INTO favorites (user_id, artwork_id) VALUES (user_id, artwork_id)
ON CONFLICT DO NOTHING;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.add_tag(p_id text, p_expiration_date date, p_read_write_count bigint DEFAULT 0, p_active boolean DEFAULT true, p_created_at timestamp without time zone DEFAULT now(), p_updated_at timestamp without time zone DEFAULT now())
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.bulk_add_artwork(artworks jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_profile_update_permissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, check_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_user(email text, password text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_manually(user_email text, user_password text, first_name text DEFAULT NULL::text, last_name text DEFAULT NULL::text, user_role text DEFAULT 'staff'::text, user_phone text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  INSERT INTO public.user_profiles(id, email)
  VALUES(NEW.id, NEW.email);
END;$function$
;

CREATE OR REPLACE FUNCTION public.delete_artwork(input_artwork_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.delete_old_avatar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user_cascade(user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
 RETURNS TABLE(id uuid, email text, first_name text, last_name text, role user_role, is_active boolean, phone text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, email_confirmed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_artwork(p_artwork_id uuid)
 RETURNS TABLE(id uuid, idnumber text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by uuid, tag_id text, tag_issued_by uuid, tag_issued_at timestamp without time zone, active boolean, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collector text, collectors jsonb, condition character varying, cost numeric, bibliographies jsonb, artwork_collectors jsonb, artwork_appraisals jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_artwork_favorite_count(p_artwork_id uuid)
 RETURNS integer
 LANGUAGE sql
AS $function$ 
  SELECT count(*) FROM favorites WHERE artwork_id = p_artwork_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_artwork_list()
 RETURNS TABLE(id uuid, idnumber text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by text, tag_id text, tag_issued_by text, tag_issued_at timestamp without time zone, active boolean, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collector text, collectors jsonb, condition character varying, cost numeric)
 LANGUAGE plpgsql
AS $function$BEGIN
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_location_users_with_email(p_location_id uuid)
 RETURNS TABLE(id uuid, location_id uuid, user_id uuid, organization_id uuid, role user_role, permissions text[], is_primary_location boolean, can_access_other_locations boolean, department text, "position" text, employee_id text, start_date date, end_date date, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid, deleted_at timestamp with time zone, user_email text, user_first_name text, user_last_name text, user_avatar_url text, location_name text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_organization_users_secure(p_organization_id uuid)
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, role text, is_active boolean, phone text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, permissions text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_popular_artworks()
 RETURNS TABLE(id uuid, title text, description text, height integer, width integer, size_unit text, artist text, year text, medium text, created_by uuid, tag_id text, tag_issued_by uuid, tag_issued_at timestamp without time zone, created_at timestamp without time zone, updated_at timestamp without time zone, id_number text, provenance text, bibliography jsonb, collectors jsonb, updated_by uuid, deleted_at timestamp without time zone, deleted_by uuid, read_write_count integer, organization_id uuid, location_id uuid, assets jsonb)
 LANGUAGE sql
AS $function$
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
  a.organization_id,
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
  a.organization_id,
  a.location_id
ORDER BY
  COUNT(f.artwork_id) DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_profiles_with_email(p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_role text DEFAULT NULL::text, p_is_active boolean DEFAULT NULL::boolean, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, role text, is_active boolean, created_at timestamp without time zone, email text, total_count integer)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_server_datetime()
 RETURNS timestamp without time zone
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN NOW() AT TIME ZONE 'UTC';
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_user_favorites(user_id uuid)
 RETURNS TABLE(id uuid, title text, description text, height integer, width integer, size_unit text, artist text, year text, medium text, created_by uuid, tag_id text, tag_issued_by uuid, tag_issued_at timestamp without time zone, created_at timestamp without time zone, updated_at timestamp without time zone, id_number text, provenance text, bibliography jsonb, collectors jsonb, updated_by uuid, deleted_at timestamp without time zone, deleted_by uuid, read_write_count integer, organization_id uuid, location_id uuid, assets jsonb)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
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
    a.organization_id,
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_locations(p_user_id uuid)
 RETURNS TABLE(location_id uuid, location_name character varying, organization_id uuid, organization_name character varying, role user_role, is_primary_location boolean, can_access_other_locations boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_with_role(user_id uuid)
 RETURNS TABLE(id uuid, email text, first_name text, last_name text, role user_role, is_active boolean, phone text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, permissions text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_users_in_my_locations()
 RETURNS TABLE(id uuid, location_id uuid, user_id uuid, organization_id uuid, role user_role, permissions text[], is_primary_location boolean, can_access_other_locations boolean, department character varying, "position" character varying, employee_id character varying, is_active boolean, start_date date, end_date date, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid, deleted_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.grant_user_permission(target_user_id uuid, permission_name text, granted_by_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_in_location(p_user_id uuid, p_location_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_artwork_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_status_history()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.remove_favorite(user_id uuid, artwork_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  delete from favorites 
  where favorites.user_id = remove_favorite.user_id and favorites.artwork_id = remove_favorite.artwork_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.revoke_user_permission(target_user_id uuid, permission_name text, revoked_by_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.safe_delete_user(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_artworks(search text)
 RETURNS TABLE(id uuid, id_number text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by text, tag_id text, tag_issued_by text, tag_issued_at timestamp without time zone, active boolean, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collector text, collectors jsonb, condition character varying, cost numeric)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_deleted_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.deleted_at := now();
  NEW.deleted_by := auth.uid();
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.updated_by := auth.uid();
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_artwork(p_artwork_id uuid, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_height double precision DEFAULT NULL::double precision, p_width double precision DEFAULT NULL::double precision, p_size_unit text DEFAULT NULL::text, p_artist text DEFAULT NULL::text, p_year text DEFAULT NULL::text, p_medium text DEFAULT NULL::text, p_tag_id text DEFAULT NULL::text, p_expiration_date date DEFAULT NULL::date, p_read_write_count integer DEFAULT NULL::integer, p_assets jsonb DEFAULT NULL::jsonb, p_provenance text DEFAULT NULL::text, p_bibliography jsonb DEFAULT NULL::jsonb, p_collectors jsonb DEFAULT NULL::jsonb, p_id_number text DEFAULT NULL::text)
 RETURNS SETOF artworks
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.update_last_login()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.profiles
  SET last_login_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_profile(user_first_name text DEFAULT NULL::text, user_last_name text DEFAULT NULL::text, user_phone text DEFAULT NULL::text, user_avatar_url text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role user_role, updated_by_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_status(target_user_id uuid, new_status boolean, updated_by_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.user_can_access_artwork(p_user_id uuid, p_artwork_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.user_can_access_location(p_location_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_location_access(p_user_id uuid, p_location_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.validate_otp(artwork_id uuid, otp_provided integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.add_artwork(p_idnumber text, p_title text, p_description text, p_height double precision, p_width double precision, p_size_unit text, p_artist text, p_year text, p_medium text, p_tag_id text DEFAULT NULL::text, p_expiration_date date DEFAULT NULL::date, p_read_write_count bigint DEFAULT 0, p_assets jsonb DEFAULT NULL::jsonb, p_provenance text DEFAULT NULL::text, p_bibliography jsonb DEFAULT NULL::jsonb, p_collectors jsonb DEFAULT NULL::jsonb, p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, idnumber text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by uuid, tag_id text, tag_issued_by uuid, tag_issued_at timestamp without time zone, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collectors jsonb, organization_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
END;
$function$
;

create or replace view "public"."current_user_profile" as  SELECT p.id,
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
   FROM (profiles p
     JOIN auth.users u ON ((u.id = p.id)))
  WHERE (p.id = auth.uid());


CREATE OR REPLACE FUNCTION public.get_organization_users_with_email(p_organization_id uuid)
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, avatar_url text, role user_role_new)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

create or replace view "public"."profiles_view" as  SELECT p.id,
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
   FROM (profiles p
     JOIN auth.users u ON ((u.id = p.id)));


create or replace view "public"."my_accessible_locations" as  SELECT l.id,
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
   FROM locations l
  WHERE user_can_access_location(l.id);


create policy "Enable delete for authenticated users"
on "public"."appraisal_appraisers"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users only"
on "public"."appraisal_appraisers"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."appraisal_appraisers"
as permissive
for select
to public
using (true);


create policy "Enable update for users based on email"
on "public"."appraisal_appraisers"
as permissive
for update
to public
using (true)
with check (true);


create policy "Enable insert for authenticated users only"
on "public"."artwork_appraisals"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."artwork_appraisals"
as permissive
for select
to public
using (true);


create policy "Enable update for users based on email"
on "public"."artwork_appraisals"
as permissive
for update
to public
using (true)
with check (true);


create policy "Enable insert for users based on user_id"
on "public"."artwork_appraisers"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."artwork_appraisers"
as permissive
for select
to public
using (true);


create policy "Enable update for users based on email"
on "public"."artwork_appraisers"
as permissive
for update
to public
using (true)
with check (true);


create policy "Allow read"
on "public"."artwork_bibliography"
as permissive
for select
to public
using (true);


create policy "Allow read"
on "public"."artwork_collectors"
as permissive
for select
to public
using (true);


create policy "Allow read on non-deleted rows"
on "public"."artworks"
as permissive
for select
to public
using ((deleted_at IS NULL));


create policy "Enable delete for all users"
on "public"."artworks"
as permissive
for delete
to public
using (true);


create policy "Enable insert for all users"
on "public"."artworks"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."artworks"
as permissive
for select
to public
using (true);


create policy "Enable update for all users"
on "public"."artworks"
as permissive
for update
to public
using (true);


create policy "All - all"
on "public"."assets"
as permissive
for all
to public
using (true)
with check (true);


create policy "Allow read"
on "public"."bibliography"
as permissive
for select
to public
using (true);


create policy "Allow read"
on "public"."collectors"
as permissive
for select
to public
using (true);


create policy "location_users_manager_all"
on "public"."location_users"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM locations l
  WHERE ((l.id = location_users.location_id) AND (l.manager_id = auth.uid())))));


create policy "location_users_org_admin_all"
on "public"."location_users"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization_users ou
  WHERE ((ou.user_id = auth.uid()) AND (ou.organization_id = location_users.organization_id) AND (ou.role = 'admin'::user_role_new) AND (ou.is_active = true)))));


create policy "location_users_self_select"
on "public"."location_users"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "location_users_super_admin_all"
on "public"."location_users"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_user'::user_role_new)))));


create policy "locations_manager_update"
on "public"."locations"
as permissive
for update
to authenticated
using ((manager_id = auth.uid()));


create policy "locations_org_admin_all"
on "public"."locations"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization_users ou
  WHERE ((ou.user_id = auth.uid()) AND (ou.organization_id = locations.organization_id) AND (ou.role = 'admin'::user_role_new) AND (ou.is_active = true)))));


create policy "locations_org_users_select"
on "public"."locations"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization_users ou
  WHERE ((ou.user_id = auth.uid()) AND (ou.organization_id = locations.organization_id) AND (ou.is_active = true) AND ((ou.permissions && ARRAY['view_all_locations'::text, 'manage_locations'::text]) OR (ou.role = ANY (ARRAY['admin'::user_role_new, 'staff'::user_role_new])))))));


create policy "locations_super_admin_all"
on "public"."locations"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_user'::user_role_new)))));


create policy "Admins can update their organizations"
on "public"."organizations"
as permissive
for update
to authenticated
using (((EXISTS ( SELECT 1
   FROM organization_users
  WHERE ((organization_users.organization_id = organizations.id) AND (organization_users.user_id = auth.uid()) AND (organization_users.role = ANY (ARRAY['admin'::user_role_new, 'super_user'::user_role_new])) AND (organization_users.is_active = true)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_user'::user_role_new) AND (profiles.is_active = true))))))
with check (((EXISTS ( SELECT 1
   FROM organization_users
  WHERE ((organization_users.organization_id = organizations.id) AND (organization_users.user_id = auth.uid()) AND (organization_users.role = ANY (ARRAY['admin'::user_role_new, 'super_user'::user_role_new])) AND (organization_users.is_active = true)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_user'::user_role_new) AND (profiles.is_active = true))))));


create policy "Authenticated users can create organizations"
on "public"."organizations"
as permissive
for insert
to authenticated
with check (true);


create policy "Users can see organizations they belong to"
on "public"."organizations"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM organization_users
  WHERE ((organization_users.organization_id = organizations.id) AND (organization_users.user_id = auth.uid()) AND (organization_users.is_active = true)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_user'::user_role_new) AND (profiles.is_active = true))))));


create policy "allow all"
on "public"."organizations"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable insert for authenticated users only"
on "public"."status_history"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable insert for all users"
on "public"."tags"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."tags"
as permissive
for select
to public
using (true);


create policy "Enable to update for all users"
on "public"."tags"
as permissive
for update
to public
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Service role full access on user_permissions"
on "public"."user_permissions"
as permissive
for all
to public
using ((current_setting('role'::text) = 'service_role'::text));


create policy "Users can view their own permissions"
on "public"."user_permissions"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Service role full access on user_sessions"
on "public"."user_sessions"
as permissive
for all
to public
using ((current_setting('role'::text) = 'service_role'::text));


create policy "Users can view their own sessions"
on "public"."user_sessions"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "authenticated_can_view_active_org_members"
on "public"."organization_users"
as permissive
for select
to authenticated
using ((is_active = true));


CREATE TRIGGER trigger_log_artwork_update BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION log_artwork_update();

CREATE TRIGGER trigger_set_deleted_fields BEFORE UPDATE ON public.artworks FOR EACH ROW WHEN (((old.deleted_at IS NULL) AND (new.deleted_at IS NOT NULL))) EXECUTE FUNCTION set_deleted_fields();

CREATE TRIGGER trigger_set_updated_by BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER update_location_users_updated_at BEFORE UPDATE ON public.location_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cleanup_old_avatar_trigger AFTER UPDATE OF avatar_url ON public.profiles FOR EACH ROW EXECUTE FUNCTION delete_old_avatar();

CREATE TRIGGER prevent_unauthorized_profile_changes BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION check_profile_update_permissions();
ALTER TABLE "public"."profiles" DISABLE TRIGGER "prevent_unauthorized_profile_changes";

CREATE TRIGGER trigger_update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_log_status_history BEFORE UPDATE ON public.tags FOR EACH ROW WHEN ((old.active IS DISTINCT FROM new.active)) EXECUTE FUNCTION log_status_history();


create schema if not exists "totp";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION totp.base32_to_hex(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION totp.generate(secret text, period integer DEFAULT 30, digits integer DEFAULT 6, time_from timestamp with time zone DEFAULT now(), hash text DEFAULT 'sha1'::text, encoding text DEFAULT 'base32'::text, clock_offset integer DEFAULT 0)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION totp.generate_secret(hash text DEFAULT 'sha1'::text)
 RETURNS bytea
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION totp.hotp(key bytea, c integer, digits integer DEFAULT 6, hash text DEFAULT 'sha1'::text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    c BYTEA := '\x' || LPAD(TO_HEX(c), 16, '0');
    mac BYTEA := HMAC(c, key, hash);
    trunc_offset INT := GET_BYTE(mac, length(mac) - 1) % 16;
    result TEXT := SUBSTRING(SET_BIT(SUBSTRING(mac FROM 1 + trunc_offset FOR 4), 7, 0)::TEXT, 2)::BIT(32)::INT % (10 ^ digits)::INT;
BEGIN
    RETURN LPAD(result, digits, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION totp.pad_secret(input bytea, len integer)
 RETURNS bytea
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION totp.random_base32(_length integer DEFAULT 20)
 RETURNS text
 LANGUAGE sql
AS $function$
  SELECT
    string_agg(('{a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,2,3,4,5,6,7}'::text[])[ceil(random() * 32)], '')
  FROM
    generate_series(1, _length);
$function$
;

CREATE OR REPLACE FUNCTION totp.url(email text, totp_secret text, totp_interval integer, totp_issuer text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
  SELECT
    concat('otpauth://totp/', totp.urlencode (email), '?secret=', totp.urlencode (totp_secret), '&period=', totp.urlencode (totp_interval::text), '&issuer=', totp.urlencode (totp_issuer));
$function$
;

CREATE OR REPLACE FUNCTION totp.urlencode(in_str text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION totp.verify(secret text, check_totp text, period integer DEFAULT 30, digits integer DEFAULT 6, time_from timestamp with time zone DEFAULT now(), hash text DEFAULT 'sha1'::text, encoding text DEFAULT 'base32'::text, clock_offset integer DEFAULT 0)
 RETURNS boolean
 LANGUAGE sql
AS $function$
  SELECT totp.generate (
    secret,
    period,
    digits,
    time_from,
    hash,
    encoding,
    clock_offset) = check_totp;
$function$
;


