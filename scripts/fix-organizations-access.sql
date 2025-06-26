-- Fix Organizations Access
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check current RLS status
SELECT 'RLS Status' as check_type,
  schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'organizations';

-- 2. Check existing policies
SELECT 'Existing Policies' as check_type,
  policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'organizations';

-- 3. Create basic RLS policy for super users to access organizations
CREATE POLICY "Super users can manage all organizations" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
  );

-- 4. Create policy for organization admins to see their own organization
CREATE POLICY "Organization admins can see their organization" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      JOIN public.profiles p ON p.id = ou.user_id
      WHERE ou.user_id = auth.uid()
        AND ou.organization_id = organizations.id
        AND ou.role IN ('admin', 'super_user')
        AND ou.is_active = true
        AND p.is_active = true
    )
  );

-- 5. Verify policies were created
SELECT 'New Policies' as check_type,
  policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'organizations';

-- 6. Test access again
SELECT 'Access Test After Policy' as check_type,
  COUNT(*) as visible_count
FROM organizations
WHERE is_active = true;