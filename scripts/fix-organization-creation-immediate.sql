-- Immediate fix for organization creation issue
-- Run this in Supabase SQL Editor to fix the RLS policy issue RIGHT NOW

-- First, check if RLS is enabled on organizations table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'organizations';

-- Drop any existing INSERT policy that might be blocking
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy_quick_fix" ON public.organizations;

-- Create a permissive INSERT policy for super users
CREATE POLICY "organizations_insert_super_users" ON public.organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
  );

-- Also ensure SELECT policy exists so you can see the organizations after creation
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;

CREATE POLICY "organizations_select_authenticated" ON public.organizations
  FOR SELECT
  USING (
    is_active = true 
    AND (
      -- Super users can see all organizations
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
          AND role = 'super_user'
          AND is_active = true
      )
      OR
      -- Users can see organizations they belong to
      EXISTS (
        SELECT 1 FROM public.organization_users
        WHERE organization_id = organizations.id
          AND user_id = auth.uid()
          AND is_active = true
      )
    )
  );

-- Verify current user details and permissions
WITH user_info AS (
  SELECT 
    auth.uid() as user_id,
    au.email,
    p.role,
    p.is_active
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.id = auth.uid()
)
SELECT 
  *,
  CASE 
    WHEN role = 'super_user' AND is_active = true THEN '✅ Can create organizations'
    ELSE '❌ Cannot create organizations - Not a super_user or not active'
  END as permission_status
FROM user_info;

-- List all current policies on organizations table
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation,
  pol.polpermissive as is_permissive,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'organizations'
ORDER BY pol.polcmd;