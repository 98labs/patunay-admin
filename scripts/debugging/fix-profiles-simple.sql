-- Simple fix for profiles table access
-- This script temporarily disables RLS to allow access

-- First, disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO anon;

-- Verify the change
SELECT 
    tablename,
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename = 'profiles';

-- Show current user's profile if it exists
SELECT 
    id,
    role,
    is_active,
    first_name,
    last_name
FROM 
    public.profiles 
WHERE 
    id = auth.uid();

-- Count total profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;