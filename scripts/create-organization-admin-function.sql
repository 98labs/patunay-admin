-- Quick deployment script for create_organization_admin function
-- Run this in Supabase SQL Editor to enable super users to create organization admins

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.create_organization_admin(uuid, text, text, text, text);

-- Create the simplified function that prepares data for edge function
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
  v_caller_role text;
BEGIN
  -- Check if caller is super_user
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid()
    AND is_active = true;
    
  IF v_caller_role != 'super_user' THEN
    RAISE EXCEPTION 'Permission denied: Only super users can create organization admins';
  END IF;
  
  -- Validate organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = p_organization_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Organization not found or inactive';
  END IF;
  
  -- Basic validation
  IF length(p_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  
  -- Generate user ID
  v_user_id := gen_random_uuid();
  
  -- Return data for edge function
  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'email', lower(p_email),
    'organization_id', p_organization_id,
    'first_name', p_first_name,
    'last_name', p_last_name,
    'role', 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_organization_admin TO authenticated;

-- Test the function (will fail without edge function, but validates permissions)
SELECT public.create_organization_admin(
  '00000000-0000-0000-0000-000000000000'::uuid, -- Replace with actual org ID
  'test@example.com',
  'Test1234!',
  'Test',
  'Admin'
);