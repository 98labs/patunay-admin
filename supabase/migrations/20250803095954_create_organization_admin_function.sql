-- Create RPC function for super users to create organization admin users
-- This function allows super users to create admin users for specific organizations

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.create_organization_admin(uuid, text, text, text, text);

-- Create the function
CREATE OR REPLACE FUNCTION public.create_organization_admin(
  p_organization_id uuid,
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_caller_id uuid;
  v_caller_role text;
  v_full_name text;
BEGIN
  -- Get the caller's ID and role
  v_caller_id := auth.uid();
  
  -- Check if caller exists and get their role
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = v_caller_id
    AND is_active = true;
    
  -- Only super users can create organization admins
  IF v_caller_role IS NULL OR v_caller_role != 'super_user' THEN
    RAISE EXCEPTION 'Permission denied: Only super users can create organization admins';
  END IF;
  
  -- Validate organization exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = p_organization_id 
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Organization not found or inactive';
  END IF;
  
  -- Validate email format
  IF NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate password length
  IF length(p_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  -- Check if user with this email already exists
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = lower(p_email)
  ) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;
  
  -- Create full name
  v_full_name := trim(p_first_name || ' ' || p_last_name);
  
  -- Call the edge function to create the auth user
  -- Note: In production, you should use an edge function for this
  -- For now, we'll return the necessary data for the client to handle
  
  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();
  
  -- Return the data needed to create the user
  -- The actual user creation will be handled by an edge function
  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'email', lower(p_email),
    'full_name', v_full_name,
    'first_name', p_first_name,
    'last_name', p_last_name,
    'organization_id', p_organization_id,
    'role', 'admin',
    'metadata', jsonb_build_object(
      'created_by', v_caller_id,
      'created_at', now(),
      'organization_id', p_organization_id,
      'role', 'admin'
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Error creating organization admin: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (permission check is inside the function)
GRANT EXECUTE ON FUNCTION public.create_organization_admin(uuid, text, text, text, text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_organization_admin IS 'Creates an admin user for a specific organization. Only super users can execute this function.';

-- Alternative: Direct user creation function (requires service role)
-- This function would be called from an edge function with service role access
CREATE OR REPLACE FUNCTION public.create_organization_admin_direct(
  p_user_id uuid,
  p_organization_id uuid,
  p_email text,
  p_full_name text,
  p_first_name text,
  p_last_name text,
  p_created_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- This function assumes the auth user has already been created
  -- It creates the profile and organization membership
  
  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    lower(p_email),
    p_full_name,
    p_first_name,
    p_last_name,
    'admin',
    true,
    now(),
    now()
  )
  RETURNING id INTO v_profile_id;
  
  -- Create organization membership
  INSERT INTO public.organization_users (
    organization_id,
    user_id,
    role,
    is_primary,
    is_active,
    created_at,
    updated_at,
    created_by
  ) VALUES (
    p_organization_id,
    v_profile_id,
    'admin',
    true,
    true,
    now(),
    now(),
    p_created_by
  );
  
  -- Log the action
  INSERT INTO public.user_update_log (
    user_id,
    updated_by,
    action,
    changes,
    created_at
  ) VALUES (
    v_profile_id,
    p_created_by,
    'create_organization_admin',
    jsonb_build_object(
      'organization_id', p_organization_id,
      'role', 'admin',
      'created_by', p_created_by
    ),
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_profile_id,
    'message', 'Organization admin created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback will happen automatically
    RAISE EXCEPTION 'Error creating organization admin profile: %', SQLERRM;
END;
$$;

-- This function should only be called from edge functions with service role
-- Do not grant execute permission to regular users

-- Add comment
COMMENT ON FUNCTION public.create_organization_admin_direct IS 'Creates profile and organization membership for an admin user. Should only be called from edge functions with service role access.';