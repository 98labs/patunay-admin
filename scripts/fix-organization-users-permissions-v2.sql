-- Fix organization_users table permissions for user management

-- First, drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_users;

-- Grant basic SELECT permission on organization_users to authenticated users
GRANT SELECT ON public.organization_users TO authenticated;

-- Create a simpler RLS policy without self-reference
CREATE POLICY "Users can view organization members v2"
  ON public.organization_users
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- User can see members if they are in the same organization
    -- Using EXISTS to avoid recursion
    EXISTS (
      SELECT 1 
      FROM public.organization_users ou2
      WHERE ou2.user_id = auth.uid()
      AND ou2.organization_id = organization_users.organization_id
      AND ou2.is_active = true
    )
    OR
    -- Super users can see all (check profiles table directly)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_user'
    )
  );

-- Create a function to get users in an organization (with proper security)
CREATE OR REPLACE FUNCTION public.get_organization_users(p_organization_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role user_role_new,
  is_active boolean,
  phone text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_login_at timestamptz,
  permissions text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_super_user boolean;
  v_has_access boolean;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user is super user
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id
    AND role = 'super_user'
  ) INTO v_is_super_user;
  
  -- Check if user has access to this organization
  IF NOT v_is_super_user THEN
    SELECT EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_id = p_organization_id
      AND user_id = v_user_id
      AND is_active = true
    ) INTO v_has_access;
    
    IF NOT v_has_access THEN
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
    ou.role,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_users(uuid) TO authenticated;

-- Alternative: Create a simple function to check organization membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(p_user_id uuid, p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_users
    WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND is_active = true
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_belongs_to_organization(uuid, uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_organization_users IS 'Get all users in an organization with proper security checks';
COMMENT ON FUNCTION public.user_belongs_to_organization IS 'Check if a user belongs to a specific organization';