-- Remove super_user role from the system
-- Convert existing super_user accounts to admin

-- First, update any existing super_user accounts to admin
UPDATE public.profiles
SET role = 'admin'
WHERE role = 'super_user';

-- Update policies to remove super_user references
-- Drop existing policies
DROP POLICY IF EXISTS "Super users and admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super users and admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super users can delete profiles" ON public.profiles;

-- Recreate policies with admin as highest role
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'admin'
        AND p.is_active = true
    )
  );

-- Update the has_permission function to remove super_user logic
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RPC functions that check for super_user
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the create_organization_admin function as it's no longer needed
DROP FUNCTION IF EXISTS public.create_organization_admin CASCADE;

-- Add comment about single-tenant conversion
COMMENT ON COLUMN public.profiles.role IS 'User role - admin is the highest role in single-tenant mode';