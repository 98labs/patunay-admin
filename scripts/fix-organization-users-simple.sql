-- Simple fix: Disable RLS on organization_users and use function-based security

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_users;
DROP POLICY IF EXISTS "Users can view organization members v2" ON public.organization_users;

-- Disable RLS on organization_users (we'll use function-based security instead)
ALTER TABLE public.organization_users DISABLE ROW LEVEL SECURITY;

-- Grant basic SELECT permission on organization_users to authenticated users
GRANT SELECT ON public.organization_users TO authenticated;

-- Create a secure function to get users in an organization
CREATE OR REPLACE FUNCTION public.get_organization_users_secure(p_organization_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_users_secure(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_organization_users_secure IS 'Securely get all users in an organization with proper access checks';