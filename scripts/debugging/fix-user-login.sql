-- Fix for login issue: ensure user has a profile record
-- This addresses the 500 error when trying to login

-- First, check if the user exists in auth.users but not in profiles
SELECT 
    au.id,
    au.email,
    p.id as profile_id
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'brian.tanseng@gmail.com';

-- If the user exists in auth.users but not in profiles, create the profile
INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    'admin'::user_role,
    true,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'brian.tanseng@gmail.com'
AND p.id IS NULL;

-- Ensure the trigger exists to create profiles for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Check RLS policies on profiles table
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
WHERE tablename = 'profiles';