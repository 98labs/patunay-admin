-- Fix organization_users table permissions for user management

-- Grant basic SELECT permission on organization_users to authenticated users
GRANT SELECT ON public.organization_users TO authenticated;

-- Create RLS policy to allow users to see organization_users for their own organizations
CREATE POLICY "Users can view organization members"
  ON public.organization_users
  FOR SELECT
  TO authenticated
  USING (
    -- User can see members of organizations they belong to
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
    OR
    -- Super users can see all
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
AS $$
BEGIN
  -- Check if user has access to this organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_id = p_organization_id
    AND user_id = auth.uid()
    AND is_active = true
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_user'
  ) THEN
    RAISE EXCEPTION 'Access denied to organization %', p_organization_id;
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
  FROM public.profiles p
  INNER JOIN public.organization_users ou ON p.id = ou.user_id
  WHERE ou.organization_id = p_organization_id
  AND ou.is_active = true
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_users(uuid) TO authenticated;

-- Create a view for current user's accessible users (alternative approach)
CREATE OR REPLACE VIEW public.accessible_users AS
SELECT DISTINCT
  p.*,
  ou.organization_id,
  ou.role as org_role
FROM public.profiles p
INNER JOIN public.organization_users ou ON p.id = ou.user_id
WHERE 
  -- User belongs to same organization as current user
  ou.organization_id IN (
    SELECT organization_id 
    FROM public.organization_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
  AND ou.is_active = true
  -- Or current user is super_user
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_user'
  );

-- Grant access to the view
GRANT SELECT ON public.accessible_users TO authenticated;

-- Add comment
COMMENT ON VIEW public.accessible_users IS 'View showing users accessible to the current user based on organization membership';