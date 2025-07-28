-- Create user_role type only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE "public"."user_role" AS ENUM ('admin', 'staff');
    END IF;
END$$;

create table if not exists "public"."appraisal_appraisers" (
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

create table if not exists "public"."artwork_appraisals" (
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

create table if not exists "public"."artwork_appraisers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "organization" text,
    "created_by" uuid,
    "updated_at" timestamp without time zone,
    "updated_by" uuid,
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid,
    "user_id" uuid
);


alter table "public"."artwork_appraisers" enable row level security;

create table if not exists "public"."artwork_bibliography" (
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

create table if not exists "public"."artwork_collectors" (
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

create table if not exists "public"."artwork_update_log" (
    "id" uuid not null default gen_random_uuid(),
    "artwork_id" uuid not null,
    "updated_by" uuid,
    "updated_at" timestamp with time zone default now(),
    "old_data" jsonb,
    "new_data" jsonb,
    "changes" jsonb,
    "created_at" timestamp with time zone default now()
);


create table if not exists "public"."artworks" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text not null,
    "height" double precision,
    "width" double precision,
    "size_unit" text,
    "artist" text not null,
    "year" text not null,
    "medium" text,
    "created_by" uuid default auth.uid(),
    "tag_id" text,
    "tag_issued_by" uuid default auth.uid(),
    "tag_issued_at" timestamp without time zone,
    "created_at" timestamp without time zone default (now() AT TIME ZONE 'utc'::text),
    "updated_at" timestamp without time zone,
    "id_number" text,
    "provenance" text,
    "bibliography" jsonb default '[]'::jsonb,
    "collectors" jsonb default '[]'::jsonb,
    "updated_by" uuid,
    "deleted_at" timestamp with time zone,
    "deleted_by" uuid,
    "read_write_count" bigint
);


alter table "public"."artworks" enable row level security;

create table if not exists "public"."assets" (
    "id" uuid not null default gen_random_uuid(),
    "artwork_id" uuid,
    "filename" text,
    "url" text,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone,
    "sort_order" bigint default '0'::bigint
);


alter table "public"."assets" enable row level security;

create table if not exists "public"."bibliography" (
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

create table if not exists "public"."collectors" (
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

create table if not exists "public"."profiles" (
    "id" uuid not null,
    "first_name" text,
    "last_name" text,
    "role" user_role default 'staff'::user_role,
    "is_active" boolean default true,
    "phone" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid,
    "updated_by" uuid,
    "last_login_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "deleted_by" uuid
);


create table if not exists "public"."status_history" (
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

create table if not exists "public"."tags" (
    "id" text not null,
    "read_write_count" bigint not null default '0'::bigint,
    "expiration_date" date,
    "active" boolean not null default true,
    "created_by" uuid default auth.uid(),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone,
    "updated_by" uuid,
    "deleted_at" timestamp without time zone,
    "deleted_by" uuid,
    "user_id" uuid
);


alter table "public"."tags" enable row level security;

create table if not exists "public"."user_permissions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "permission" text not null,
    "granted_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_permissions" enable row level security;

create table if not exists "public"."user_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "session_token" text,
    "ip_address" inet,
    "user_agent" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone default now()
);


alter table "public"."user_sessions" enable row level security;

CREATE UNIQUE INDEX IF NOT EXISTS appraisal_appraisers_pkey ON public.appraisal_appraisers USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS art_appraiser_pkey ON public.artwork_appraisers USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS artwork_appraisals_pkey ON public.artwork_appraisals USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS artwork_appraisers_name_key ON public.artwork_appraisers USING btree (name);

CREATE UNIQUE INDEX IF NOT EXISTS artwork_bibliography_pkey ON public.artwork_bibliography USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS artwork_collectors_pkey ON public.artwork_collectors USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS artwork_update_log_pkey ON public.artwork_update_log USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS artworks_pkey ON public.artworks USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS artworks_tag_id_key ON public.artworks USING btree (tag_id);

CREATE UNIQUE INDEX IF NOT EXISTS assets_pkey ON public.assets USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS bibliography_pkey ON public.bibliography USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS collectors_pkey ON public.collectors USING btree (id);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles USING btree (deleted_at);

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS status_history_pkey ON public.status_history USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS user_permissions_pkey ON public.user_permissions USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS user_permissions_user_id_permission_key ON public.user_permissions USING btree (user_id, permission);

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_pkey ON public.user_sessions USING btree (id);

alter table "public"."appraisal_appraisers" add constraint "appraisal_appraisers_pkey" PRIMARY KEY using index "appraisal_appraisers_pkey";

alter table "public"."artwork_appraisals" add constraint "artwork_appraisals_pkey" PRIMARY KEY using index "artwork_appraisals_pkey";

alter table "public"."artwork_appraisers" add constraint "art_appraiser_pkey" PRIMARY KEY using index "art_appraiser_pkey";

alter table "public"."artwork_bibliography" add constraint "artwork_bibliography_pkey" PRIMARY KEY using index "artwork_bibliography_pkey";

alter table "public"."artwork_collectors" add constraint "artwork_collectors_pkey" PRIMARY KEY using index "artwork_collectors_pkey";

alter table "public"."artwork_update_log" add constraint "artwork_update_log_pkey" PRIMARY KEY using index "artwork_update_log_pkey";

alter table "public"."artworks" add constraint "artworks_pkey" PRIMARY KEY using index "artworks_pkey";

alter table "public"."assets" add constraint "assets_pkey" PRIMARY KEY using index "assets_pkey";

alter table "public"."bibliography" add constraint "bibliography_pkey" PRIMARY KEY using index "bibliography_pkey";

alter table "public"."collectors" add constraint "collectors_pkey" PRIMARY KEY using index "collectors_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."status_history" add constraint "status_history_pkey" PRIMARY KEY using index "status_history_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."user_permissions" add constraint "user_permissions_pkey" PRIMARY KEY using index "user_permissions_pkey";

alter table "public"."user_sessions" add constraint "user_sessions_pkey" PRIMARY KEY using index "user_sessions_pkey";

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

alter table "public"."artworks" add constraint "artworks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."artworks" validate constraint "artworks_created_by_fkey";

alter table "public"."artworks" add constraint "artworks_owner_id_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."artworks" validate constraint "artworks_owner_id_fkey";

alter table "public"."artworks" add constraint "artworks_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."artworks" validate constraint "artworks_tag_id_fkey";

alter table "public"."artworks" add constraint "artworks_tag_id_key" UNIQUE using index "artworks_tag_id_key";

alter table "public"."artworks" add constraint "artworks_tag_issued_by_fkey" FOREIGN KEY (tag_issued_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."artworks" validate constraint "artworks_tag_issued_by_fkey";

alter table "public"."assets" add constraint "assets_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES artworks(id) not valid;

alter table "public"."assets" validate constraint "assets_artwork_id_fkey";

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

alter table "public"."profiles" add constraint "profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_deleted_by_fkey" FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_deleted_by_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_updated_by_fkey";

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

alter table "public"."tags" add constraint "tags_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) not valid;

alter table "public"."tags" validate constraint "tags_updated_by_fkey";

alter table "public"."tags" add constraint "tags_updated_by_fkey1" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."tags" validate constraint "tags_updated_by_fkey1";

alter table "public"."tags" add constraint "tags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."tags" validate constraint "tags_user_id_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_granted_by_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_user_id_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_user_id_permission_key" UNIQUE using index "user_permissions_user_id_permission_key";

alter table "public"."user_sessions" add constraint "user_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_sessions" validate constraint "user_sessions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_artwork(p_idnumber text, p_title text, p_description text, p_height double precision, p_width double precision, p_size_unit text, p_artist text, p_year text, p_medium text, p_tag_id text DEFAULT NULL::text, p_expiration_date date DEFAULT NULL::date, p_read_write_count bigint DEFAULT 0, p_assets jsonb DEFAULT NULL::jsonb, p_provenance text DEFAULT NULL::text, p_bibliography jsonb DEFAULT NULL::jsonb, p_collectors jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(id uuid, idnumber text, title text, description text, height double precision, width double precision, size_unit text, artist text, year text, medium text, created_by text, tag_id text, tag_issued_by text, tag_issued_at timestamp without time zone, created_at timestamp without time zone, assets jsonb, provenance text, bibliography jsonb, collectors jsonb)
 LANGUAGE plpgsql
AS $function$
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

create or replace view "public"."current_user_profile" as  SELECT p.id,
    p.first_name,
    p.last_name,
    p.role,
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
    au.email AS auth_email,
    au.created_at AS auth_created_at
   FROM (profiles p
     JOIN auth.users au ON ((au.id = p.id)))
  WHERE (p.id = auth.uid());


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

create or replace view "public"."profiles_view" as  SELECT profiles.id,
    profiles.first_name,
    profiles.last_name,
    profiles.role,
    profiles.is_active,
    profiles.phone,
    profiles.avatar_url,
    profiles.created_at,
    profiles.updated_at,
    profiles.created_by,
    profiles.updated_by,
    profiles.last_login_at,
    profiles.deleted_at,
    profiles.deleted_by,
    users.email,
    COALESCE(array_agg(user_permissions.permission) FILTER (WHERE (user_permissions.permission IS NOT NULL)), '{}'::text[]) AS permissions
   FROM ((profiles
     JOIN auth.users ON ((profiles.id = users.id)))
     LEFT JOIN user_permissions ON ((profiles.id = user_permissions.user_id)))
  GROUP BY profiles.id, users.email;


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

grant delete on table "public"."appraisal_appraisers" to "anon";

grant insert on table "public"."appraisal_appraisers" to "anon";

grant references on table "public"."appraisal_appraisers" to "anon";

grant select on table "public"."appraisal_appraisers" to "anon";

grant trigger on table "public"."appraisal_appraisers" to "anon";

grant truncate on table "public"."appraisal_appraisers" to "anon";

grant update on table "public"."appraisal_appraisers" to "anon";

grant delete on table "public"."appraisal_appraisers" to "authenticated";

grant insert on table "public"."appraisal_appraisers" to "authenticated";

grant references on table "public"."appraisal_appraisers" to "authenticated";

grant select on table "public"."appraisal_appraisers" to "authenticated";

grant trigger on table "public"."appraisal_appraisers" to "authenticated";

grant truncate on table "public"."appraisal_appraisers" to "authenticated";

grant update on table "public"."appraisal_appraisers" to "authenticated";

grant delete on table "public"."appraisal_appraisers" to "service_role";

grant insert on table "public"."appraisal_appraisers" to "service_role";

grant references on table "public"."appraisal_appraisers" to "service_role";

grant select on table "public"."appraisal_appraisers" to "service_role";

grant trigger on table "public"."appraisal_appraisers" to "service_role";

grant truncate on table "public"."appraisal_appraisers" to "service_role";

grant update on table "public"."appraisal_appraisers" to "service_role";

grant delete on table "public"."artwork_appraisals" to "anon";

grant insert on table "public"."artwork_appraisals" to "anon";

grant references on table "public"."artwork_appraisals" to "anon";

grant select on table "public"."artwork_appraisals" to "anon";

grant trigger on table "public"."artwork_appraisals" to "anon";

grant truncate on table "public"."artwork_appraisals" to "anon";

grant update on table "public"."artwork_appraisals" to "anon";

grant delete on table "public"."artwork_appraisals" to "authenticated";

grant insert on table "public"."artwork_appraisals" to "authenticated";

grant references on table "public"."artwork_appraisals" to "authenticated";

grant select on table "public"."artwork_appraisals" to "authenticated";

grant trigger on table "public"."artwork_appraisals" to "authenticated";

grant truncate on table "public"."artwork_appraisals" to "authenticated";

grant update on table "public"."artwork_appraisals" to "authenticated";

grant delete on table "public"."artwork_appraisals" to "service_role";

grant insert on table "public"."artwork_appraisals" to "service_role";

grant references on table "public"."artwork_appraisals" to "service_role";

grant select on table "public"."artwork_appraisals" to "service_role";

grant trigger on table "public"."artwork_appraisals" to "service_role";

grant truncate on table "public"."artwork_appraisals" to "service_role";

grant update on table "public"."artwork_appraisals" to "service_role";

grant delete on table "public"."artwork_appraisers" to "anon";

grant insert on table "public"."artwork_appraisers" to "anon";

grant references on table "public"."artwork_appraisers" to "anon";

grant select on table "public"."artwork_appraisers" to "anon";

grant trigger on table "public"."artwork_appraisers" to "anon";

grant truncate on table "public"."artwork_appraisers" to "anon";

grant update on table "public"."artwork_appraisers" to "anon";

grant delete on table "public"."artwork_appraisers" to "authenticated";

grant insert on table "public"."artwork_appraisers" to "authenticated";

grant references on table "public"."artwork_appraisers" to "authenticated";

grant select on table "public"."artwork_appraisers" to "authenticated";

grant trigger on table "public"."artwork_appraisers" to "authenticated";

grant truncate on table "public"."artwork_appraisers" to "authenticated";

grant update on table "public"."artwork_appraisers" to "authenticated";

grant delete on table "public"."artwork_appraisers" to "service_role";

grant insert on table "public"."artwork_appraisers" to "service_role";

grant references on table "public"."artwork_appraisers" to "service_role";

grant select on table "public"."artwork_appraisers" to "service_role";

grant trigger on table "public"."artwork_appraisers" to "service_role";

grant truncate on table "public"."artwork_appraisers" to "service_role";

grant update on table "public"."artwork_appraisers" to "service_role";

grant delete on table "public"."artwork_bibliography" to "anon";

grant insert on table "public"."artwork_bibliography" to "anon";

grant references on table "public"."artwork_bibliography" to "anon";

grant select on table "public"."artwork_bibliography" to "anon";

grant trigger on table "public"."artwork_bibliography" to "anon";

grant truncate on table "public"."artwork_bibliography" to "anon";

grant update on table "public"."artwork_bibliography" to "anon";

grant delete on table "public"."artwork_bibliography" to "authenticated";

grant insert on table "public"."artwork_bibliography" to "authenticated";

grant references on table "public"."artwork_bibliography" to "authenticated";

grant select on table "public"."artwork_bibliography" to "authenticated";

grant trigger on table "public"."artwork_bibliography" to "authenticated";

grant truncate on table "public"."artwork_bibliography" to "authenticated";

grant update on table "public"."artwork_bibliography" to "authenticated";

grant delete on table "public"."artwork_bibliography" to "service_role";

grant insert on table "public"."artwork_bibliography" to "service_role";

grant references on table "public"."artwork_bibliography" to "service_role";

grant select on table "public"."artwork_bibliography" to "service_role";

grant trigger on table "public"."artwork_bibliography" to "service_role";

grant truncate on table "public"."artwork_bibliography" to "service_role";

grant update on table "public"."artwork_bibliography" to "service_role";

grant delete on table "public"."artwork_collectors" to "anon";

grant insert on table "public"."artwork_collectors" to "anon";

grant references on table "public"."artwork_collectors" to "anon";

grant select on table "public"."artwork_collectors" to "anon";

grant trigger on table "public"."artwork_collectors" to "anon";

grant truncate on table "public"."artwork_collectors" to "anon";

grant update on table "public"."artwork_collectors" to "anon";

grant delete on table "public"."artwork_collectors" to "authenticated";

grant insert on table "public"."artwork_collectors" to "authenticated";

grant references on table "public"."artwork_collectors" to "authenticated";

grant select on table "public"."artwork_collectors" to "authenticated";

grant trigger on table "public"."artwork_collectors" to "authenticated";

grant truncate on table "public"."artwork_collectors" to "authenticated";

grant update on table "public"."artwork_collectors" to "authenticated";

grant delete on table "public"."artwork_collectors" to "service_role";

grant insert on table "public"."artwork_collectors" to "service_role";

grant references on table "public"."artwork_collectors" to "service_role";

grant select on table "public"."artwork_collectors" to "service_role";

grant trigger on table "public"."artwork_collectors" to "service_role";

grant truncate on table "public"."artwork_collectors" to "service_role";

grant update on table "public"."artwork_collectors" to "service_role";

grant delete on table "public"."artwork_update_log" to "anon";

grant insert on table "public"."artwork_update_log" to "anon";

grant references on table "public"."artwork_update_log" to "anon";

grant select on table "public"."artwork_update_log" to "anon";

grant trigger on table "public"."artwork_update_log" to "anon";

grant truncate on table "public"."artwork_update_log" to "anon";

grant update on table "public"."artwork_update_log" to "anon";

grant delete on table "public"."artwork_update_log" to "authenticated";

grant insert on table "public"."artwork_update_log" to "authenticated";

grant references on table "public"."artwork_update_log" to "authenticated";

grant select on table "public"."artwork_update_log" to "authenticated";

grant trigger on table "public"."artwork_update_log" to "authenticated";

grant truncate on table "public"."artwork_update_log" to "authenticated";

grant update on table "public"."artwork_update_log" to "authenticated";

grant delete on table "public"."artwork_update_log" to "service_role";

grant insert on table "public"."artwork_update_log" to "service_role";

grant references on table "public"."artwork_update_log" to "service_role";

grant select on table "public"."artwork_update_log" to "service_role";

grant trigger on table "public"."artwork_update_log" to "service_role";

grant truncate on table "public"."artwork_update_log" to "service_role";

grant update on table "public"."artwork_update_log" to "service_role";

grant delete on table "public"."artworks" to "anon";

grant insert on table "public"."artworks" to "anon";

grant references on table "public"."artworks" to "anon";

grant select on table "public"."artworks" to "anon";

grant trigger on table "public"."artworks" to "anon";

grant truncate on table "public"."artworks" to "anon";

grant update on table "public"."artworks" to "anon";

grant delete on table "public"."artworks" to "authenticated";

grant insert on table "public"."artworks" to "authenticated";

grant references on table "public"."artworks" to "authenticated";

grant select on table "public"."artworks" to "authenticated";

grant trigger on table "public"."artworks" to "authenticated";

grant truncate on table "public"."artworks" to "authenticated";

grant update on table "public"."artworks" to "authenticated";

grant delete on table "public"."artworks" to "service_role";

grant insert on table "public"."artworks" to "service_role";

grant references on table "public"."artworks" to "service_role";

grant select on table "public"."artworks" to "service_role";

grant trigger on table "public"."artworks" to "service_role";

grant truncate on table "public"."artworks" to "service_role";

grant update on table "public"."artworks" to "service_role";

grant delete on table "public"."assets" to "anon";

grant insert on table "public"."assets" to "anon";

grant references on table "public"."assets" to "anon";

grant select on table "public"."assets" to "anon";

grant trigger on table "public"."assets" to "anon";

grant truncate on table "public"."assets" to "anon";

grant update on table "public"."assets" to "anon";

grant delete on table "public"."assets" to "authenticated";

grant insert on table "public"."assets" to "authenticated";

grant references on table "public"."assets" to "authenticated";

grant select on table "public"."assets" to "authenticated";

grant trigger on table "public"."assets" to "authenticated";

grant truncate on table "public"."assets" to "authenticated";

grant update on table "public"."assets" to "authenticated";

grant delete on table "public"."assets" to "service_role";

grant insert on table "public"."assets" to "service_role";

grant references on table "public"."assets" to "service_role";

grant select on table "public"."assets" to "service_role";

grant trigger on table "public"."assets" to "service_role";

grant truncate on table "public"."assets" to "service_role";

grant update on table "public"."assets" to "service_role";

grant delete on table "public"."bibliography" to "anon";

grant insert on table "public"."bibliography" to "anon";

grant references on table "public"."bibliography" to "anon";

grant select on table "public"."bibliography" to "anon";

grant trigger on table "public"."bibliography" to "anon";

grant truncate on table "public"."bibliography" to "anon";

grant update on table "public"."bibliography" to "anon";

grant delete on table "public"."bibliography" to "authenticated";

grant insert on table "public"."bibliography" to "authenticated";

grant references on table "public"."bibliography" to "authenticated";

grant select on table "public"."bibliography" to "authenticated";

grant trigger on table "public"."bibliography" to "authenticated";

grant truncate on table "public"."bibliography" to "authenticated";

grant update on table "public"."bibliography" to "authenticated";

grant delete on table "public"."bibliography" to "service_role";

grant insert on table "public"."bibliography" to "service_role";

grant references on table "public"."bibliography" to "service_role";

grant select on table "public"."bibliography" to "service_role";

grant trigger on table "public"."bibliography" to "service_role";

grant truncate on table "public"."bibliography" to "service_role";

grant update on table "public"."bibliography" to "service_role";

grant delete on table "public"."collectors" to "anon";

grant insert on table "public"."collectors" to "anon";

grant references on table "public"."collectors" to "anon";

grant select on table "public"."collectors" to "anon";

grant trigger on table "public"."collectors" to "anon";

grant truncate on table "public"."collectors" to "anon";

grant update on table "public"."collectors" to "anon";

grant delete on table "public"."collectors" to "authenticated";

grant insert on table "public"."collectors" to "authenticated";

grant references on table "public"."collectors" to "authenticated";

grant select on table "public"."collectors" to "authenticated";

grant trigger on table "public"."collectors" to "authenticated";

grant truncate on table "public"."collectors" to "authenticated";

grant update on table "public"."collectors" to "authenticated";

grant delete on table "public"."collectors" to "service_role";

grant insert on table "public"."collectors" to "service_role";

grant references on table "public"."collectors" to "service_role";

grant select on table "public"."collectors" to "service_role";

grant trigger on table "public"."collectors" to "service_role";

grant truncate on table "public"."collectors" to "service_role";

grant update on table "public"."collectors" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."status_history" to "anon";

grant insert on table "public"."status_history" to "anon";

grant references on table "public"."status_history" to "anon";

grant select on table "public"."status_history" to "anon";

grant trigger on table "public"."status_history" to "anon";

grant truncate on table "public"."status_history" to "anon";

grant update on table "public"."status_history" to "anon";

grant delete on table "public"."status_history" to "authenticated";

grant insert on table "public"."status_history" to "authenticated";

grant references on table "public"."status_history" to "authenticated";

grant select on table "public"."status_history" to "authenticated";

grant trigger on table "public"."status_history" to "authenticated";

grant truncate on table "public"."status_history" to "authenticated";

grant update on table "public"."status_history" to "authenticated";

grant delete on table "public"."status_history" to "service_role";

grant insert on table "public"."status_history" to "service_role";

grant references on table "public"."status_history" to "service_role";

grant select on table "public"."status_history" to "service_role";

grant trigger on table "public"."status_history" to "service_role";

grant truncate on table "public"."status_history" to "service_role";

grant update on table "public"."status_history" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."user_permissions" to "anon";

grant insert on table "public"."user_permissions" to "anon";

grant references on table "public"."user_permissions" to "anon";

grant select on table "public"."user_permissions" to "anon";

grant trigger on table "public"."user_permissions" to "anon";

grant truncate on table "public"."user_permissions" to "anon";

grant update on table "public"."user_permissions" to "anon";

grant delete on table "public"."user_permissions" to "authenticated";

grant insert on table "public"."user_permissions" to "authenticated";

grant references on table "public"."user_permissions" to "authenticated";

grant select on table "public"."user_permissions" to "authenticated";

grant trigger on table "public"."user_permissions" to "authenticated";

grant truncate on table "public"."user_permissions" to "authenticated";

grant update on table "public"."user_permissions" to "authenticated";

grant delete on table "public"."user_permissions" to "service_role";

grant insert on table "public"."user_permissions" to "service_role";

grant references on table "public"."user_permissions" to "service_role";

grant select on table "public"."user_permissions" to "service_role";

grant trigger on table "public"."user_permissions" to "service_role";

grant truncate on table "public"."user_permissions" to "service_role";

grant update on table "public"."user_permissions" to "service_role";

grant delete on table "public"."user_sessions" to "anon";

grant insert on table "public"."user_sessions" to "anon";

grant references on table "public"."user_sessions" to "anon";

grant select on table "public"."user_sessions" to "anon";

grant trigger on table "public"."user_sessions" to "anon";

grant truncate on table "public"."user_sessions" to "anon";

grant update on table "public"."user_sessions" to "anon";

grant delete on table "public"."user_sessions" to "authenticated";

grant insert on table "public"."user_sessions" to "authenticated";

grant references on table "public"."user_sessions" to "authenticated";

grant select on table "public"."user_sessions" to "authenticated";

grant trigger on table "public"."user_sessions" to "authenticated";

grant truncate on table "public"."user_sessions" to "authenticated";

grant update on table "public"."user_sessions" to "authenticated";

grant delete on table "public"."user_sessions" to "service_role";

grant insert on table "public"."user_sessions" to "service_role";

grant references on table "public"."user_sessions" to "service_role";

grant select on table "public"."user_sessions" to "service_role";

grant trigger on table "public"."user_sessions" to "service_role";

grant truncate on table "public"."user_sessions" to "service_role";

grant update on table "public"."user_sessions" to "service_role";

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."appraisal_appraisers";

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


create policy "Admins can manage all permissions"
on "public"."user_permissions"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));


create policy "Admins can manage user permissions"
on "public"."user_permissions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))));


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


create policy "Admins can manage all sessions"
on "public"."user_sessions"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));


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


CREATE TRIGGER trigger_log_artwork_update BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION log_artwork_update();

CREATE TRIGGER trigger_set_deleted_fields BEFORE UPDATE ON public.artworks FOR EACH ROW WHEN (((old.deleted_at IS NULL) AND (new.deleted_at IS NOT NULL))) EXECUTE FUNCTION set_deleted_fields();

CREATE TRIGGER trigger_set_updated_by BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER cleanup_old_avatar_trigger AFTER UPDATE OF avatar_url ON public.profiles FOR EACH ROW EXECUTE FUNCTION delete_old_avatar();

CREATE TRIGGER prevent_unauthorized_profile_changes BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION check_profile_update_permissions();
ALTER TABLE "public"."profiles" DISABLE TRIGGER "prevent_unauthorized_profile_changes";

CREATE TRIGGER trigger_update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_log_status_history BEFORE UPDATE ON public.tags FOR EACH ROW WHEN ((old.active IS DISTINCT FROM new.active)) EXECUTE FUNCTION log_status_history();


CREATE TRIGGER trigger_update_last_login AFTER INSERT ON auth.sessions FOR EACH ROW EXECUTE FUNCTION update_last_login();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


grant delete on table "storage"."s3_multipart_uploads" to "postgres";

grant insert on table "storage"."s3_multipart_uploads" to "postgres";

grant references on table "storage"."s3_multipart_uploads" to "postgres";

grant select on table "storage"."s3_multipart_uploads" to "postgres";

grant trigger on table "storage"."s3_multipart_uploads" to "postgres";

grant truncate on table "storage"."s3_multipart_uploads" to "postgres";

grant update on table "storage"."s3_multipart_uploads" to "postgres";

grant delete on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant insert on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant references on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant select on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant trigger on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant truncate on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant update on table "storage"."s3_multipart_uploads_parts" to "postgres";

-- Drop all existing storage policies to avoid conflicts
DO $$
DECLARE
    policy_names TEXT[] := ARRAY[
        'Allow authenticated users to delete artifacts',
        'Allow authenticated users to delete avatars',
        'Allow authenticated users to update artifacts',
        'Allow authenticated users to update avatars',
        'Allow authenticated users to upload artifacts',
        'Allow authenticated users to upload avatars',
        'Allow public read access to artifacts',
        'Allow public read access to avatars',
        'Allow service role to manage all artifacts',
        'Allow service role to manage all avatars',
        'Give access to a file to user 9akkwx_0',
        'Give access to a file to user 9akkwx_1',
        'Give access to a file to user 9akkwx_2',
        'Give access to a file to user 9akkwx_3',
        'Give anon users access to JPG images in folder 9akkwx_0',
        'Give users authenticated access to folder 9akkwx_0',
        'Give users authenticated access to folder 9akkwx_1',
        'Give users authenticated access to folder 9akkwx_2',
        'Give users authenticated access to folder 9akkwx_3'
    ];
    policy_name TEXT;
BEGIN
    FOREACH policy_name IN ARRAY policy_names
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END$$;

-- Drop all storage policies first


DROP POLICY IF EXISTS "Allow authenticated users to delete artifacts" ON "storage"."objects";

create policy "Allow authenticated users to delete artifacts"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL)));


DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON "storage"."objects";

create policy "Allow authenticated users to delete avatars"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL)));


DROP POLICY IF EXISTS "Allow authenticated users to update artifacts" ON "storage"."objects";

create policy "Allow authenticated users to update artifacts"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL)))
with check (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL)));


DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON "storage"."objects";

create policy "Allow authenticated users to update avatars"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL)))
with check (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL)));


DROP POLICY IF EXISTS "Allow authenticated users to upload artifacts" ON "storage"."objects";

create policy "Allow authenticated users to upload artifacts"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'artifacts'::text) AND ((auth.uid())::text IS NOT NULL)));


create policy "Allow authenticated users to upload avatars"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text IS NOT NULL)));


create policy "Allow public read access to artifacts"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'artifacts'::text));


create policy "Allow public read access to avatars"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'user-avatars'::text));


create policy "Allow service role to manage all artifacts"
on "storage"."objects"
as permissive
for all
to service_role
using ((bucket_id = 'artifacts'::text))
with check ((bucket_id = 'artifacts'::text));


create policy "Allow service role to manage all avatars"
on "storage"."objects"
as permissive
for all
to service_role
using ((bucket_id = 'user-avatars'::text))
with check ((bucket_id = 'user-avatars'::text));


create policy "Give access to a file to user 9akkwx_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


create policy "Give access to a file to user 9akkwx_1"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


create policy "Give access to a file to user 9akkwx_2"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


create policy "Give access to a file to user 9akkwx_3"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'artifacts'::text) AND (name = 'admin/assets/Costa Rican Frog.jpg'::text) AND (( SELECT (auth.uid())::text AS uid) = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'::text)));


create policy "Give anon users access to JPG images in folder 9akkwx_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'artifacts'::text) AND (storage.extension(name) = 'jpg'::text) AND (lower((storage.foldername(name))[1]) = 'public'::text) AND (auth.role() = 'anon'::text)));


create policy "Give users authenticated access to folder 9akkwx_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder 9akkwx_1"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder 9akkwx_2"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder 9akkwx_3"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'artifacts'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));



