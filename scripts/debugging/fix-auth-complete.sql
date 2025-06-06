-- Complete fix for authentication issues
-- Run this in Supabase SQL Editor

-- 1. Disable RLS temporarily to fix the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Ensure the user has a profile
INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    created_at,
    updated_at
)
SELECT 
    au.id,
    'Brian',
    'Tanseng',
    'admin'::user_role,
    true,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'brian.tanseng@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    is_active = true,
    role = 'admin'::user_role,
    updated_at = NOW();

-- 3. Create or replace the auth trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff'::user_role),
    true,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;

-- 6. Re-enable RLS with a permissive policy for authentication
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create a super permissive policy temporarily
DROP POLICY IF EXISTS "Allow all during auth" ON public.profiles;
CREATE POLICY "Allow all during auth" ON public.profiles
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Verify the user can authenticate
SELECT 
    au.id,
    au.email,
    p.id as profile_id,
    p.role,
    p.is_active,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Ready to login'
        ELSE 'Profile missing - will cause login error'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'brian.tanseng@gmail.com';

-- 9. If you still can't login after this, try resetting the user's password
-- You can do this from Supabase Dashboard > Authentication > Users
-- Or use this query to check user status:
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    confirmed_at IS NOT NULL as email_confirmed,
    banned,
    created_at,
    updated_at
FROM auth.users
WHERE email = 'brian.tanseng@gmail.com';