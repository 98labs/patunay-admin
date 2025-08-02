-- Secure User Management Functions
-- These functions replace client-side admin operations with secure server-side implementations

-- ============================================================================
-- 1. CREATE USER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  p_email text,
  p_password text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_role user_role_new DEFAULT 'staff',
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_permissions text[] DEFAULT '{}'::text[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_user_id uuid;
  v_current_user_role user_role_new;
  v_auth_user jsonb;
  v_profile jsonb;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current user's role
  SELECT role INTO v_current_user_role
  FROM profiles
  WHERE id = v_current_user_id;

  -- Check permissions
  -- Only super_users can create other super_users
  IF p_role = 'super_user' AND v_current_user_role != 'super_user' THEN
    RAISE EXCEPTION 'Only super users can create other super users';
  END IF;

  -- Only super_users and admins can create users
  IF v_current_user_role NOT IN ('super_user', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to create users';
  END IF;

  -- For admins, they can only create users in their organization
  IF v_current_user_role = 'admin' AND p_organization_id IS NOT NULL THEN
    -- Check if admin belongs to this organization
    IF NOT EXISTS (
      SELECT 1 FROM organization_users
      WHERE user_id = v_current_user_id 
      AND organization_id = p_organization_id
      AND role = 'admin'
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'You can only create users in your own organization';
    END IF;
  END IF;

  -- Create auth user (this requires service role in the backend)
  -- Since we can't directly create auth users from SQL, we'll return instructions
  -- for the client to call a secure edge function
  
  -- For now, just create the profile entry assuming the auth user will be created
  -- In production, this should be wrapped in a transaction with auth user creation
  
  -- Generate a UUID for the new user
  v_user_id := gen_random_uuid();
  
  -- Create profile
  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    role,
    phone,
    avatar_url,
    is_active,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_first_name,
    p_last_name,
    p_role,
    p_phone,
    p_avatar_url,
    true,
    v_current_user_id,
    now(),
    now()
  );

  -- Add to organization if specified
  IF p_organization_id IS NOT NULL THEN
    INSERT INTO organization_users (
      organization_id,
      user_id,
      role,
      permissions,
      is_primary,
      is_active,
      created_by
    ) VALUES (
      p_organization_id,
      v_user_id,
      p_role,
      p_permissions,
      true,
      true,
      v_current_user_id
    );
  END IF;

  -- Return the created user data
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p_email,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'role', p.role,
    'phone', p.phone,
    'avatar_url', p.avatar_url,
    'is_active', p.is_active,
    'created_at', p.created_at,
    'requires_auth_creation', true,
    'auth_params', jsonb_build_object(
      'email', p_email,
      'password', p_password,
      'user_id', v_user_id
    )
  ) INTO v_profile
  FROM profiles p
  WHERE p.id = v_user_id;

  RETURN v_profile;
END;
$$;

-- ============================================================================
-- 2. UPDATE USER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id uuid,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_role user_role_new DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_current_user_role user_role_new;
  v_target_user_role user_role_new;
  v_result jsonb;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current user's role
  SELECT role INTO v_current_user_role
  FROM profiles
  WHERE id = v_current_user_id;

  -- Get target user's current role
  SELECT role INTO v_target_user_role
  FROM profiles
  WHERE id = p_user_id;

  -- Check permissions
  IF v_current_user_role = 'super_user' THEN
    -- Super users can update anyone
    NULL;
  ELSIF v_current_user_role = 'admin' THEN
    -- Admins can only update users in their organization
    IF NOT EXISTS (
      SELECT 1 FROM organization_users ou1
      JOIN organization_users ou2 ON ou1.organization_id = ou2.organization_id
      WHERE ou1.user_id = v_current_user_id 
      AND ou2.user_id = p_user_id
      AND ou1.role = 'admin'
      AND ou1.is_active = true
    ) THEN
      RAISE EXCEPTION 'You can only update users in your organization';
    END IF;

    -- Admins cannot promote users to super_user
    IF p_role = 'super_user' THEN
      RAISE EXCEPTION 'Only super users can promote to super user role';
    END IF;

    -- Admins cannot demote other admins or super users
    IF v_target_user_role IN ('super_user', 'admin') AND p_role IS NOT NULL AND p_role != v_target_user_role THEN
      RAISE EXCEPTION 'You cannot change the role of admins or super users';
    END IF;
  ELSE
    -- Other roles can only update their own profile (limited fields)
    IF p_user_id != v_current_user_id THEN
      RAISE EXCEPTION 'You can only update your own profile';
    END IF;
    
    -- Non-admins cannot change roles or active status
    IF p_role IS NOT NULL OR p_is_active IS NOT NULL THEN
      RAISE EXCEPTION 'You cannot change role or active status';
    END IF;
  END IF;

  -- Update profile
  UPDATE profiles
  SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    role = COALESCE(p_role, role),
    is_active = COALESCE(p_is_active, is_active),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now(),
    updated_by = v_current_user_id
  WHERE id = p_user_id;

  -- Return updated user data
  SELECT jsonb_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'role', p.role,
    'is_active', p.is_active,
    'phone', p.phone,
    'avatar_url', p.avatar_url,
    'updated_at', p.updated_at
  ) INTO v_result
  FROM profiles p
  WHERE p.id = p_user_id;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- 3. SOFT DELETE USER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.soft_delete_user(
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_current_user_role user_role_new;
  v_target_user_role user_role_new;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent self-deletion
  IF p_user_id = v_current_user_id THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Get current user's role
  SELECT role INTO v_current_user_role
  FROM profiles
  WHERE id = v_current_user_id;

  -- Get target user's role
  SELECT role INTO v_target_user_role
  FROM profiles
  WHERE id = p_user_id;

  -- Check permissions
  IF v_current_user_role = 'super_user' THEN
    -- Super users can delete anyone except other super users
    IF v_target_user_role = 'super_user' THEN
      RAISE EXCEPTION 'Super users cannot be deleted';
    END IF;
  ELSIF v_current_user_role = 'admin' THEN
    -- Admins can only delete users in their organization
    IF NOT EXISTS (
      SELECT 1 FROM organization_users ou1
      JOIN organization_users ou2 ON ou1.organization_id = ou2.organization_id
      WHERE ou1.user_id = v_current_user_id 
      AND ou2.user_id = p_user_id
      AND ou1.role = 'admin'
      AND ou1.is_active = true
    ) THEN
      RAISE EXCEPTION 'You can only delete users in your organization';
    END IF;

    -- Admins cannot delete other admins or super users
    IF v_target_user_role IN ('super_user', 'admin') THEN
      RAISE EXCEPTION 'You cannot delete admins or super users';
    END IF;
  ELSE
    RAISE EXCEPTION 'Insufficient permissions to delete users';
  END IF;

  -- Soft delete the user
  UPDATE profiles
  SET
    is_active = false,
    deleted_at = now(),
    deleted_by = v_current_user_id
  WHERE id = p_user_id;

  -- Deactivate all organization memberships
  UPDATE organization_users
  SET
    is_active = false,
    deleted_at = now(),
    deleted_by = v_current_user_id
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'deleted_at', now()
  );
END;
$$;

-- ============================================================================
-- 4. GET USERS WITH FILTERING
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_organization_users(
  p_organization_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_role user_role_new DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_current_user_role user_role_new;
  v_result jsonb;
  v_count int;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current user's role
  SELECT role INTO v_current_user_role
  FROM profiles
  WHERE id = v_current_user_id;

  -- Build query based on permissions
  IF v_current_user_role = 'super_user' THEN
    -- Super users can see all users
    WITH filtered_users AS (
      SELECT 
        p.*,
        au.email,
        au.created_at as auth_created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'organization_id', ou.organization_id,
              'organization_name', o.name,
              'role', ou.role,
              'is_primary', ou.is_primary
            ) 
          ) FILTER (WHERE ou.organization_id IS NOT NULL),
          '[]'::json
        ) as organizations
      FROM profiles p
      LEFT JOIN auth.users au ON au.id = p.id
      LEFT JOIN organization_users ou ON ou.user_id = p.id AND ou.is_active = true
      LEFT JOIN organizations o ON o.id = ou.organization_id
      WHERE 
        (p_is_active IS NULL OR p.is_active = p_is_active)
        AND (p_role IS NULL OR p.role = p_role)
        AND (p_search IS NULL OR (
          p.first_name ILIKE '%' || p_search || '%' OR
          p.last_name ILIKE '%' || p_search || '%' OR
          au.email ILIKE '%' || p_search || '%'
        ))
        AND (p_organization_id IS NULL OR EXISTS (
          SELECT 1 FROM organization_users ou2 
          WHERE ou2.user_id = p.id 
          AND ou2.organization_id = p_organization_id
          AND ou2.is_active = true
        ))
      GROUP BY p.id, au.id, au.email, au.created_at
      ORDER BY p.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    )
    SELECT jsonb_build_object(
      'data', jsonb_agg(row_to_json(filtered_users.*)),
      'count', (SELECT COUNT(*) FROM profiles p WHERE p_is_active IS NULL OR p.is_active = p_is_active)
    ) INTO v_result
    FROM filtered_users;
  ELSIF v_current_user_role = 'admin' THEN
    -- Admins can only see users in their organizations
    WITH admin_orgs AS (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = v_current_user_id 
      AND role = 'admin' 
      AND is_active = true
    ),
    filtered_users AS (
      SELECT DISTINCT
        p.*,
        au.email,
        au.created_at as auth_created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'organization_id', ou.organization_id,
              'organization_name', o.name,
              'role', ou.role,
              'is_primary', ou.is_primary
            ) 
          ) FILTER (WHERE ou.organization_id IS NOT NULL),
          '[]'::json
        ) as organizations
      FROM profiles p
      LEFT JOIN auth.users au ON au.id = p.id
      JOIN organization_users ou ON ou.user_id = p.id AND ou.is_active = true
      JOIN organizations o ON o.id = ou.organization_id
      WHERE 
        ou.organization_id IN (SELECT organization_id FROM admin_orgs)
        AND (p_is_active IS NULL OR p.is_active = p_is_active)
        AND (p_role IS NULL OR p.role = p_role)
        AND (p_search IS NULL OR (
          p.first_name ILIKE '%' || p_search || '%' OR
          p.last_name ILIKE '%' || p_search || '%' OR
          au.email ILIKE '%' || p_search || '%'
        ))
        AND (p_organization_id IS NULL OR ou.organization_id = p_organization_id)
      GROUP BY p.id, au.id, au.email, au.created_at
      ORDER BY p.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    )
    SELECT jsonb_build_object(
      'data', jsonb_agg(row_to_json(filtered_users.*)),
      'count', (
        SELECT COUNT(DISTINCT p.id) 
        FROM profiles p
        JOIN organization_users ou ON ou.user_id = p.id 
        WHERE ou.organization_id IN (
          SELECT organization_id 
          FROM organization_users 
          WHERE user_id = v_current_user_id 
          AND role = 'admin' 
          AND is_active = true
        )
        AND (p_is_active IS NULL OR p.is_active = p_is_active)
      )
    ) INTO v_result
    FROM filtered_users;
  ELSE
    -- Other users can only see themselves
    SELECT jsonb_build_object(
      'data', jsonb_agg(jsonb_build_object(
        'id', p.id,
        'email', au.email,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'role', p.role,
        'is_active', p.is_active,
        'phone', p.phone,
        'avatar_url', p.avatar_url,
        'created_at', p.created_at
      )),
      'count', 1
    ) INTO v_result
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE p.id = v_current_user_id;
  END IF;

  RETURN COALESCE(v_result, jsonb_build_object('data', '[]'::jsonb, 'count', 0));
END;
$$;

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.create_user_with_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_users TO authenticated;

-- ============================================================================
-- 6. ADD RLS POLICIES FOR SECURE ACCESS
-- ============================================================================

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super users can view all profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own basic info" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Can only update certain fields
    (
      (role = OLD.role) AND
      (is_active = OLD.is_active) AND
      (deleted_at IS NULL OR deleted_at = OLD.deleted_at) AND
      (deleted_by IS NULL OR deleted_by = OLD.deleted_by)
    )
  );

CREATE POLICY "Admins can view org users" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou1
      JOIN organization_users ou2 ON ou1.organization_id = ou2.organization_id
      WHERE ou1.user_id = auth.uid()
      AND ou2.user_id = profiles.id
      AND ou1.role = 'admin'
      AND ou1.is_active = true
    )
  );

CREATE POLICY "Super users can view all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_user'
    )
  );

-- Add comment explaining the security model
COMMENT ON SCHEMA public IS 'User management functions use SECURITY DEFINER to perform privileged operations while maintaining security through permission checks within the functions.';