-- Fix Organization Update Permissions
-- Run this in Supabase Dashboard SQL Editor

-- 1. Ensure UPDATE permission is granted
GRANT UPDATE ON public.organizations TO authenticated;

-- 2. Ensure related tables have SELECT permissions (needed for RLS policies)
GRANT SELECT ON public.organization_users TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 3. Drop existing UPDATE policy if it exists and recreate
DO $$
BEGIN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Admins can update their organizations" ON public.organizations;
    
    -- Create new UPDATE policy
    CREATE POLICY "Organization members can update their organization"
    ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (
        -- User must be an active admin or super_user in the organization
        EXISTS (
            SELECT 1 
            FROM public.organization_users ou
            WHERE ou.organization_id = organizations.id
                AND ou.user_id = auth.uid()
                AND ou.role IN ('admin', 'super_user')
                AND ou.is_active = true
        )
        OR
        -- Or be a global super user
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            WHERE p.id = auth.uid()
                AND p.role = 'super_user'
                AND p.is_active = true
        )
    )
    WITH CHECK (
        -- Same check for the new row values
        EXISTS (
            SELECT 1 
            FROM public.organization_users ou
            WHERE ou.organization_id = organizations.id
                AND ou.user_id = auth.uid()
                AND ou.role IN ('admin', 'super_user')
                AND ou.is_active = true
        )
        OR
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            WHERE p.id = auth.uid()
                AND p.role = 'super_user'
                AND p.is_active = true
        )
    );
    
    -- Also ensure the email check constraint allows updates
    -- (The constraint already allows NULL, so no changes needed)
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- 4. Verify the policy was created
SELECT 
    'Verification' as step,
    policyname, 
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'organizations'
    AND schemaname = 'public'
    AND cmd = 'UPDATE';

-- 5. Test if authenticated users can now update
SELECT 
    'Permission Test' as step,
    has_table_privilege('authenticated', 'public.organizations', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'public.organization_users', 'SELECT') as can_read_org_users,
    has_table_privilege('authenticated', 'public.profiles', 'SELECT') as can_read_profiles;