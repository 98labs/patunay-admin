-- Migration to simplify the application to single-tenant, single-organization
-- This removes multi-tenant functionality and organization management

-- ============================================================================
-- 1. DROP DEPENDENT VIEWS AND POLICIES FIRST
-- ============================================================================

-- Drop views that depend on organization columns
DROP VIEW IF EXISTS public.current_user_profile CASCADE;
DROP VIEW IF EXISTS public.profiles_view CASCADE;
DROP VIEW IF EXISTS public.my_accessible_locations CASCADE;

-- Drop all RLS policies that might reference organization columns
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on tables that have organization_id
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('organizations', 'organization_users', 'cross_org_permissions', 
                          'artworks', 'tags', 'artwork_appraisers', 'locations', 
                          'location_users', 'profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                       pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Drop functions that reference organizations
DROP FUNCTION IF EXISTS public.get_user_organizations(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_organization_members(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_organization_permission(uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_organization(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_organization_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_organization_users(uuid, text, text, boolean, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.create_organization_with_admin(text, text, text, text, text, text, jsonb, jsonb) CASCADE;

-- ============================================================================
-- 2. REMOVE ORGANIZATION_ID FROM RELATED TABLES
-- ============================================================================

-- Remove organization_id from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove organization_id from artworks
ALTER TABLE public.artworks DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove organization_id from tags
ALTER TABLE public.tags DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove organization_id from artwork_appraisers
ALTER TABLE public.artwork_appraisers DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove organization_id from locations
ALTER TABLE public.locations DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove organization_id from location_users
ALTER TABLE public.location_users DROP COLUMN IF EXISTS organization_id CASCADE;

-- ============================================================================
-- 3. DROP ORGANIZATION-RELATED TABLES
-- ============================================================================

-- Drop cross-organizational permissions table
DROP TABLE IF EXISTS public.cross_org_permissions CASCADE;

-- Drop organization users table
DROP TABLE IF EXISTS public.organization_users CASCADE;

-- Drop organizations table
DROP TABLE IF EXISTS public.organizations CASCADE;

-- ============================================================================
-- 4. DROP ORGANIZATION-RELATED TYPES
-- ============================================================================

-- Drop organization type enum
DROP TYPE IF EXISTS organization_type CASCADE;

-- Drop cross-org permission type enum
DROP TYPE IF EXISTS cross_org_permission_type CASCADE;

-- ============================================================================
-- 5. RECREATE SIMPLIFIED VIEWS
-- ============================================================================

-- Recreate current_user_profile view without organization data
CREATE OR REPLACE VIEW public.current_user_profile AS
SELECT 
  p.*,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

-- Recreate profiles_view without organization data
CREATE OR REPLACE VIEW public.profiles_view AS
SELECT 
  p.*,
  u.email,
  u.created_at as user_created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;

-- ============================================================================
-- 6. CREATE NEW SIMPLIFIED RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_appraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin')
        AND is_active = true
    )
  );

-- Artwork policies
CREATE POLICY "Users can view artworks" ON public.artworks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Authorized users can create artworks" ON public.artworks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin', 'issuer', 'staff')
        AND is_active = true
    )
  );

CREATE POLICY "Authorized users can update artworks" ON public.artworks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin', 'issuer', 'staff')
        AND is_active = true
    )
  );

CREATE POLICY "Authorized users can delete artworks" ON public.artworks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin')
        AND is_active = true
    )
  );

-- Tag policies
CREATE POLICY "Users can view tags" ON public.tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Authorized users can manage tags" ON public.tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin', 'issuer')
        AND is_active = true
    )
  );

-- Location policies
CREATE POLICY "Users can view locations" ON public.locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Admins can manage locations" ON public.locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin')
        AND is_active = true
    )
  );

-- Location users policies
CREATE POLICY "Users can view location assignments" ON public.location_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Admins can manage location assignments" ON public.location_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin')
        AND is_active = true
    )
  );

-- User permissions policies
CREATE POLICY "Users can view own permissions" ON public.user_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin')
        AND is_active = true
    )
  );

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all sessions" ON public.user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_user', 'admin')
        AND is_active = true
    )
  );

-- ============================================================================
-- 7. CREATE SIMPLIFIED FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(check_permission text)
RETURNS boolean AS $$
DECLARE
  user_role user_role_new;
  has_perm boolean;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
  
  -- Super users have all permissions
  IF user_role = 'super_user' THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions
  CASE user_role
    WHEN 'admin' THEN
      has_perm := check_permission IN (
        'manage_users', 'manage_artworks', 'manage_nfc_tags', 
        'manage_appraisals', 'view_statistics', 'manage_settings',
        'manage_locations'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role_new AS $$
DECLARE
  user_role user_role_new;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id AND is_active = true;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. UPDATE RPC FUNCTIONS TO REMOVE ORGANIZATION PARAMETERS
-- ============================================================================

-- Update add_artwork function to remove organization parameter
CREATE OR REPLACE FUNCTION public.add_artwork(
  p_idnumber text,
  p_title text,
  p_description text DEFAULT NULL,
  p_height numeric DEFAULT NULL,
  p_width numeric DEFAULT NULL,
  p_size_unit text DEFAULT NULL,
  p_artist text DEFAULT NULL,
  p_year text DEFAULT NULL,
  p_medium text DEFAULT NULL,
  p_tag_id text DEFAULT NULL,
  p_expiration_date timestamp with time zone DEFAULT NULL,
  p_read_write_count integer DEFAULT NULL,
  p_assets jsonb DEFAULT NULL,
  p_provenance text DEFAULT NULL,
  p_bibliography text[] DEFAULT '{}',
  p_collectors text[] DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_user_with_profile function to remove organization parameter
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  p_email text,
  p_password text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_role user_role_new DEFAULT 'viewer',
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_permissions text[] DEFAULT '{}'
) RETURNS jsonb AS $$
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
  
  IF v_creator_role NOT IN ('super_user', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to create users';
  END IF;
  
  -- Validate role assignment
  IF p_role = 'super_user' AND v_creator_role != 'super_user' THEN
    RAISE EXCEPTION 'Only super users can create other super users';
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. CLEANUP AND OPTIMIZE
-- ============================================================================

-- Drop indexes related to organizations
DROP INDEX IF EXISTS idx_organizations_type;
DROP INDEX IF EXISTS idx_organizations_active;
DROP INDEX IF EXISTS idx_organizations_created_by;
DROP INDEX IF EXISTS idx_organization_users_org_id;
DROP INDEX IF EXISTS idx_organization_users_user_id;
DROP INDEX IF EXISTS idx_organization_users_role;
DROP INDEX IF EXISTS idx_organization_users_active;
DROP INDEX IF EXISTS idx_organization_users_primary;
DROP INDEX IF EXISTS idx_artworks_organization_id;
DROP INDEX IF EXISTS idx_tags_organization_id;
DROP INDEX IF EXISTS idx_artwork_appraisers_organization_id;
DROP INDEX IF EXISTS idx_locations_organization_id;
DROP INDEX IF EXISTS idx_location_users_organization_id;

-- Add comment about single-tenant conversion
COMMENT ON SCHEMA public IS 'Single-tenant Patunay Admin application schema';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;