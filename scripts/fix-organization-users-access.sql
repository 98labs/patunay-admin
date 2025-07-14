-- Fix Organization Users Access
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check RLS status for organization_users table
SELECT 'RLS Status organization_users' as check_type,
  schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'organization_users';

-- 2. Check existing policies on organization_users
SELECT 'Existing Policies organization_users' as check_type,
  policyname, cmd, permissive, roles
FROM pg_policies
WHERE tablename = 'organization_users';

-- 3. Create RLS policy for users to see their own organization memberships
CREATE POLICY "Users can see their own organization memberships" ON public.organization_users
  FOR SELECT USING (user_id = auth.uid());

-- 4. Create policy for super users to see all organization memberships
CREATE POLICY "Super users can see all organization memberships" ON public.organization_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
  );

-- 5. Test query that the frontend uses
SELECT 'Frontend Query Test' as check_type,
  ou.*,
  o.name as org_name,
  o.type as org_type
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid()
  AND ou.is_active = true;

-- 6. Verify policies were created
SELECT 'New Policies organization_users' as check_type,
  policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'organization_users';