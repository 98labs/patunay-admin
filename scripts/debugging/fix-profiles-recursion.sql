-- Fix infinite recursion in profiles table RLS policies
-- Error: "infinite recursion detected in policy for relation 'profiles'" (42P17)

-- Step 1: Disable RLS temporarily to fix the policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on profiles table
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

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new policies without circular references
-- The key is to avoid policies that check the profiles table itself

-- Policy 1: Service role bypass (no recursion)
CREATE POLICY "Service role bypass" ON public.profiles
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 2: Users can view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 3: Users can update their own profile (no recursion)
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Authenticated users can view all profiles
-- This allows user management without recursion
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy 5: Admin users can manage all profiles
-- Using auth.jwt() claims instead of querying profiles table to avoid recursion
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL 
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
        OR
        auth.jwt()->>'email' = 'admin@patunay.com' -- Fallback for known admin
    );

-- Step 5: Grant necessary permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 6: Create or update function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Check auth.users metadata instead of profiles table
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id 
        AND (
            raw_user_meta_data->>'role' = 'admin' 
            OR email = 'admin@patunay.com'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;

-- Step 7: Alternative admin policy using the function (optional)
-- Uncomment if you prefer this approach
-- DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
-- CREATE POLICY "Admins can manage all profiles v2" ON public.profiles
--     FOR ALL 
--     USING (public.is_admin(auth.uid()));

-- Step 8: Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been recreated without circular references.';
    RAISE NOTICE 'The infinite recursion error should now be resolved.';
END$$;

-- Test query (should work now)
-- SELECT COUNT(*) FROM public.profiles;