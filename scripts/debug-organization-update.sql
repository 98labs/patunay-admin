-- Debug Organization Update Issues
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check if UPDATE permission exists for authenticated users
SELECT 
    'UPDATE permissions' as check_type,
    grantee, 
    table_name,
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'organizations' 
    AND table_schema = 'public'
    AND privilege_type = 'UPDATE'
ORDER BY grantee;

-- 2. Check RLS policies for UPDATE
SELECT 
    'UPDATE policies' as check_type,
    policyname, 
    cmd,
    roles::text,
    permissive,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'organizations'
    AND schemaname = 'public'
    AND cmd = 'UPDATE'
ORDER BY policyname;

-- 3. Check if RLS is enabled
SELECT 
    'RLS enabled' as check_type,
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'organizations'
    AND schemaname = 'public';

-- 4. Test UPDATE permission for authenticated role
SELECT 
    'Can authenticated UPDATE' as check_type,
    has_table_privilege('authenticated', 'public.organizations', 'UPDATE') as has_update_permission;

-- 5. Check all policies on organizations table
SELECT 
    'All policies' as check_type,
    policyname, 
    cmd,
    permissive,
    roles::text
FROM pg_policies
WHERE tablename = 'organizations'
    AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 6. Check if there are any triggers that might block updates
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'organizations'
    AND event_object_schema = 'public';

-- 7. Check organization_users table permissions (needed for policy checks)
SELECT 
    'organization_users permissions' as check_type,
    grantee, 
    table_name,
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'organization_users' 
    AND table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 8. Check profiles table permissions (needed for policy checks)
SELECT 
    'profiles permissions' as check_type,
    grantee, 
    table_name,
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;