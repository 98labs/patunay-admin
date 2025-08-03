-- Migration to remove all organization and location-related tables and functions
-- This completes the single-tenant conversion

-- Drop views that might depend on these tables
DROP VIEW IF EXISTS public.organization_members_view CASCADE;
DROP VIEW IF EXISTS public.location_users_view CASCADE;

-- Drop policies on location tables
DROP POLICY IF EXISTS "Users can view locations in their organization" ON public.locations;
DROP POLICY IF EXISTS "Organization admins can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Users can view location users in their organization" ON public.location_users;
DROP POLICY IF EXISTS "Location admins can manage location users" ON public.location_users;
DROP POLICY IF EXISTS "Organization admins can manage location users" ON public.location_users;

-- Drop functions related to organizations and locations
DROP FUNCTION IF EXISTS public.get_user_locations(uuid);
DROP FUNCTION IF EXISTS public.get_organization_locations(uuid);
DROP FUNCTION IF EXISTS public.add_user_to_location(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.remove_user_from_location(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_organization_admin(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_organization_admin_stats();

-- Drop location-related tables
DROP TABLE IF EXISTS public.location_users CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- Drop any remaining organization-related columns in other tables
-- Note: These should already be removed by previous migration, but checking to be sure
DO $$ 
BEGIN
    -- Check if organization_id exists in profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'profiles' 
               AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles DROP COLUMN organization_id;
    END IF;
    
    -- Check if organization_id exists in artworks
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'artworks' 
               AND column_name = 'organization_id') THEN
        ALTER TABLE public.artworks DROP COLUMN organization_id;
    END IF;
    
    -- Check if organization_id exists in tags
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'tags' 
               AND column_name = 'organization_id') THEN
        ALTER TABLE public.tags DROP COLUMN organization_id;
    END IF;
END $$;

-- Drop organization-related types if they exist
DROP TYPE IF EXISTS public.organization_role CASCADE;
DROP TYPE IF EXISTS public.location_role CASCADE;

-- Remove any organization-related RLS policies that might remain
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Remove policies that reference organization
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (definition LIKE '%organization%' OR definition LIKE '%location%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Clean up any remaining organization-related functions
DROP FUNCTION IF EXISTS public.get_user_organization(uuid);
DROP FUNCTION IF EXISTS public.get_user_organizations(uuid);
DROP FUNCTION IF EXISTS public.is_organization_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_organization_member(uuid, uuid);

-- Remove organization-related audit columns if they exist
DO $$ 
BEGIN
    -- Remove created_by_organization if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND column_name = 'created_by_organization') THEN
        EXECUTE 'ALTER TABLE public.' || table_name || ' DROP COLUMN created_by_organization'
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'created_by_organization';
    END IF;
END $$;

-- Add comment documenting the single-tenant conversion
COMMENT ON SCHEMA public IS 'Single-tenant Patunay application schema - organization and location management removed';