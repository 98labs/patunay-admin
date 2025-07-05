-- Fix RLS policies for profiles table to allow admin access without recursion
-- This script replaces the problematic admin policy

-- Step 1: Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;

-- Step 2: Create a new admin policy that checks the profiles table role correctly
-- This uses a subquery with SECURITY DEFINER to avoid recursion
CREATE POLICY "Admins have full access" ON public.profiles
  FOR ALL 
  USING (
    -- Check if current user has admin role in profiles table
    -- Using a direct check with auth.uid() to avoid recursion
    (
      SELECT role = 'admin'
      FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- Alternative approach: Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role from profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id
  LIMIT 1;
  
  -- Return true if user is admin
  RETURN user_role = 'admin';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO anon, authenticated;

-- Alternative admin policy using the function (uncomment to use)
-- DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
-- CREATE POLICY "Admins have full access v2" ON public.profiles
--   FOR ALL 
--   USING (public.is_user_admin(auth.uid()));

-- Step 3: Ensure other policies are correct
-- These should already exist, but let's make sure

-- Service role bypass
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
CREATE POLICY "Service role has full access" ON public.profiles
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can view all profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 4: Grant permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 5: Test the policies
-- This should work for admin users
-- SELECT * FROM public.profiles LIMIT 5;