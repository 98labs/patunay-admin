-- Fix for "Database error granting user" login issue
-- This error occurs when auth succeeds but database operations fail

-- Step 1: Ensure the handle_new_user function is properly defined
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Create a profile entry for the new user
  INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')::user_role,
    true,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger to automatically create profiles for new users
-- First drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 3: Fix any existing users that don't have profiles
-- This will create profiles for all users who are missing them
INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    CASE 
        WHEN au.email = 'brian.tanseng@gmail.com' THEN 'admin'::user_role
        ELSE 'staff'::user_role
    END,
    true,
    COALESCE(au.created_at, NOW())
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Step 4: Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Step 5: Check if there are any RLS policies that might be blocking
-- This query will show all policies on the profiles table
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

-- Step 6: Verify the fix by checking if all users have profiles
SELECT 
    au.id,
    au.email,
    au.created_at as user_created,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.role,
    p.is_active,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

-- If you see any users with NULL profile_id after running this script,
-- there might be additional constraints or issues to investigate