-- Fix profiles table 500 error
-- This script addresses RLS policies and permissions issues

-- 1. First, ensure the profiles table has proper structure
ALTER TABLE IF EXISTS public.profiles 
  ALTER COLUMN role SET DEFAULT 'staff'::user_role;

-- 2. Temporarily disable RLS to diagnose the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role bypass" ON public.profiles;

-- 4. Grant necessary permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 5. Create simplified RLS policies without circular references
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY "Service role has full access" ON public.profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to see all profiles (for user management)
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to do everything (without recursion)
-- Check auth.users metadata instead of profiles table
CREATE POLICY "Admins have full access" ON public.profiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6. Ensure the handle_new_user function exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')::user_role,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE
  SET 
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create any missing profiles for existing auth users
INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'staff')::user_role,
  true,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 10. Verify the fix
DO $$
DECLARE
  profile_count INTEGER;
  auth_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;
  
  RAISE NOTICE 'Profiles count: %, Auth users count: %', profile_count, auth_user_count;
  
  IF profile_count = 0 AND auth_user_count > 0 THEN
    RAISE WARNING 'No profiles found but auth users exist. Manual intervention may be needed.';
  END IF;
END $$;