-- Fix RLS policies for profiles table to allow user management

-- First, check if the profiles table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE 'Profiles table does not exist. Please run create-profiles-table.sql first.';
        RETURN;
    END IF;
END $$;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Service role bypass (for backend operations)
CREATE POLICY "Service role full access" ON public.profiles
    FOR ALL
    USING (
        -- Check if the request is coming from service role
        auth.jwt() ->> 'role' = 'service_role' OR
        -- Also allow if using service_role key
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Policy 4: Admin users can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
            AND p.is_active = true
        )
    );

-- Policy 5: Admin users can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
            AND p.is_active = true
        )
    );

-- Policy 6: Admin users can insert new profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
            AND p.is_active = true
        )
    );

-- Policy 7: Admin users can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
            AND p.is_active = true
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO anon;

-- Add helpful comment
COMMENT ON TABLE public.profiles IS 'User profiles with RLS policies for user management. Admins can manage all users, users can view/update their own profile.';

-- Test the policies (optional - will show current user's access)
DO $$
DECLARE
    current_user_id uuid;
    current_user_role text;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT role INTO current_user_role FROM public.profiles WHERE id = current_user_id;
        RAISE NOTICE 'Current user ID: %, Role: %', current_user_id, COALESCE(current_user_role, 'No profile');
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END $$;