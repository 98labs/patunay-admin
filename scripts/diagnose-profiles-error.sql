-- Diagnostic script to identify and fix profiles table 500 error
-- Run this in Supabase SQL editor to diagnose the issue

-- 1. Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) as profiles_table_exists;

-- 2. Check RLS status
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 3. Check current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Check if user_role type exists
SELECT EXISTS (
  SELECT 1 FROM pg_type WHERE typname = 'user_role'
) as user_role_type_exists;

-- 5. Check columns in profiles table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Check if handle_new_user function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
) as handle_new_user_exists;

-- 7. Check triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 8. Test a simple query (this might fail with 500)
-- Uncomment to test:
-- SELECT COUNT(*) FROM public.profiles;

-- 9. Check for any constraint violations
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 10. Check permissions on profiles table
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Quick fix attempt (if you want to try disabling RLS temporarily)
-- Uncomment the lines below to apply:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON public.profiles TO anon, authenticated, service_role;