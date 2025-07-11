-- Fix admin access to User Management
-- This script ensures admin users can properly access the system

-- Step 1: Check current user and their profile
DO $$
DECLARE
    current_user_id uuid;
    current_user_email text;
    profile_exists boolean;
    user_role text;
BEGIN
    -- Get current user from auth
    SELECT auth.uid() INTO current_user_id;
    SELECT auth.email() INTO current_user_email;
    
    RAISE NOTICE 'Current user ID: %', current_user_id;
    RAISE NOTICE 'Current user email: %', current_user_email;
    
    -- Check if profile exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE id = current_user_id
    ) INTO profile_exists;
    
    RAISE NOTICE 'Profile exists: %', profile_exists;
    
    -- Get user role
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Current user role: %', user_role;
END$$;

-- Step 2: Update current user to admin (if needed)
-- Uncomment and modify the email to match your admin user
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = auth.uid();

-- Step 3: Ensure profiles table has proper RLS policies
-- First, check current policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 4: Create a simple RLS setup that works
-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
-- 1. Service role can do everything
CREATE POLICY "service_role_all" ON public.profiles
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Authenticated users can view all profiles
CREATE POLICY "authenticated_select" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (true);

-- 3. Users can update their own profile
CREATE POLICY "users_update_own" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Admin users can do everything
-- This policy checks the role in a way that avoids recursion
CREATE POLICY "admin_all" ON public.profiles
    FOR ALL 
    TO authenticated
    USING (
        id = auth.uid() AND role = 'admin'  -- Can always access own profile if admin
        OR 
        EXISTS (  -- Can access others if current user is admin
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
            LIMIT 1
        )
    )
    WITH CHECK (
        id = auth.uid() AND role = 'admin'  -- Can always modify own profile if admin
        OR 
        EXISTS (  -- Can modify others if current user is admin
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
            LIMIT 1
        )
    );

-- Step 5: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE, DELETE ON public.profiles TO authenticated;

-- Step 6: Create or update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    SET updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 7: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Test queries
-- These should work after running this script
-- SELECT * FROM public.profiles LIMIT 5;
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- Step 9: Create a helper view for current user
CREATE OR REPLACE VIEW public.current_user_profile AS
SELECT 
    p.*,
    au.email as auth_email,
    au.created_at as auth_created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.current_user_profile TO authenticated;

-- Step 10: Verify your user is admin
DO $$
DECLARE
    your_role text;
BEGIN
    SELECT role INTO your_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    IF your_role = 'admin' THEN
        RAISE NOTICE 'SUCCESS: You are an admin user!';
    ELSE
        RAISE NOTICE 'WARNING: Your role is %, not admin. Update your profile role to admin.', your_role;
    END IF;
END$$;