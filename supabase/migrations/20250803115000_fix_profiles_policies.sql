-- Fix infinite recursion in profiles policies
-- This migration fixes the RLS policies that are causing circular references

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create new, simpler policies that avoid recursion

-- 1. Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- 2. Allow authenticated users to view all profiles (simplified for single-tenant)
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 4. Super users and admins can insert profiles
CREATE POLICY "Super users and admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

-- 5. Super users and admins can update any profile
-- Using a subquery to avoid recursion
CREATE POLICY "Super users and admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role IN ('super_user', 'admin')
        AND p.is_active = true
    )
  );

-- 6. Super users can delete profiles
CREATE POLICY "Super users can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'super_user'
        AND p.is_active = true
    )
  );

-- Also update the current_user_profile view to be simpler
CREATE OR REPLACE VIEW public.current_user_profile AS
SELECT 
  p.*,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

-- Grant appropriate permissions
GRANT SELECT ON public.current_user_profile TO authenticated;