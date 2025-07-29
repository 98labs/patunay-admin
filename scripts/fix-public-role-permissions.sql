-- Fix public role permissions for organizations table
-- This script grants necessary permissions to the public role

-- 1. Grant basic permissions to public role
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant table permissions for organizations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

-- 3. Grant sequence permissions (for auto-increment fields)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Check current permissions
SELECT 
    'Current permissions for organizations table' as info,
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'organizations' 
    AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 5. Ensure RLS is enabled
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 6. Create a basic policy for authenticated users to create organizations
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
    
    -- Create new policy
    CREATE POLICY "Authenticated users can create organizations" 
    ON public.organizations
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);
    
    -- Also create a policy to allow users to see organizations they're members of
    DROP POLICY IF EXISTS "Users can see organizations they belong to" ON public.organizations;
    
    CREATE POLICY "Users can see organizations they belong to" 
    ON public.organizations
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = organizations.id
            AND organization_users.user_id = auth.uid()
            AND organization_users.is_active = true
        )
        OR
        -- Allow super users to see all organizations
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_user'
            AND profiles.is_active = true
        )
    );
    
    -- Policy for updating organizations (only admins and super users)
    DROP POLICY IF EXISTS "Admins can update their organizations" ON public.organizations;
    
    CREATE POLICY "Admins can update their organizations" 
    ON public.organizations
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = organizations.id
            AND organization_users.user_id = auth.uid()
            AND organization_users.role IN ('admin', 'super_user')
            AND organization_users.is_active = true
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_user'
            AND profiles.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_users
            WHERE organization_users.organization_id = organizations.id
            AND organization_users.user_id = auth.uid()
            AND organization_users.role IN ('admin', 'super_user')
            AND organization_users.is_active = true
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_user'
            AND profiles.is_active = true
        )
    );
END $$;

-- 7. List all policies on organizations table
SELECT 
    'Policies on organizations table' as info,
    policyname, 
    cmd, 
    roles::text,
    permissive
FROM pg_policies
WHERE tablename = 'organizations'
AND schemaname = 'public'
ORDER BY policyname;

-- 8. Test the permission
-- This should work for authenticated users now
SELECT 'Test: Can authenticated user access organizations table' as test,
    current_user,
    has_table_privilege('authenticated', 'public.organizations', 'INSERT') as can_insert,
    has_table_privilege('authenticated', 'public.organizations', 'SELECT') as can_select,
    has_table_privilege('authenticated', 'public.organizations', 'UPDATE') as can_update,
    has_table_privilege('authenticated', 'public.organizations', 'DELETE') as can_delete;