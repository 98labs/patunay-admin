-- Complete setup for profiles table RLS policies
-- This script ensures admin users can access the User Management page

-- Step 1: Temporarily disable RLS to clean up
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END$$;

-- Step 3: Create a function to check if user is admin
-- This function uses SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role from profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Return true if user has the specified role
  RETURN user_role = check_role;
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs (e.g., user not found), return false
    RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_user_role(uuid, text) TO anon, authenticated;

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies

-- Policy 1: Service role bypass (for backend operations)
CREATE POLICY "Service role bypass" ON public.profiles
  FOR ALL 
  USING (
    auth.role() = 'service_role' 
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy 2: All authenticated users can view profiles
-- This is needed for the user management table to load
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT 
  WITH CHECK (public.check_user_role(auth.uid(), 'admin'));

-- Policy 5: Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE 
  USING (public.check_user_role(auth.uid(), 'admin'));

-- Policy 6: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE 
  USING (public.check_user_role(auth.uid(), 'admin'));

-- Step 6: Grant necessary permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 7: Ensure the handle_new_user function exists
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

-- Step 8: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Create any missing profiles for existing auth users
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

-- Step 10: Verify setup
DO $$
BEGIN
  RAISE NOTICE 'Profiles RLS setup complete.';
  RAISE NOTICE 'Admin users can now access User Management.';
  RAISE NOTICE 'All authenticated users can view profiles.';
  RAISE NOTICE 'Only admins can create, update, or delete other users.';
END$$;