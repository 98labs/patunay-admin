-- Comprehensive diagnostic for "Database error granting user" login issue

-- 1. Check if the user exists
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'brian.tanseng@gmail.com';

-- 2. Check if profile exists
SELECT 
    p.*,
    au.email
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'brian.tanseng@gmail.com';

-- 3. Check RLS status on profiles table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 4. Check all RLS policies on profiles
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
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 5. Check if auth hooks/triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 6. Test creating a profile manually (if missing)
-- First check if profile exists
DO $$
DECLARE
    user_id uuid;
    profile_exists boolean;
BEGIN
    -- Get user ID
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'brian.tanseng@gmail.com';
    
    -- Check if profile exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE id = user_id
    ) INTO profile_exists;
    
    -- Create profile if missing
    IF NOT profile_exists AND user_id IS NOT NULL THEN
        INSERT INTO public.profiles (
            id, 
            first_name, 
            last_name, 
            role, 
            is_active, 
            created_at
        ) VALUES (
            user_id,
            'Brian',
            'Tanseng',
            'admin'::user_role,
            true,
            NOW()
        );
        RAISE NOTICE 'Profile created for user %', user_id;
    ELSE
        RAISE NOTICE 'Profile already exists or user not found';
    END IF;
END $$;

-- 7. Check function permissions
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'handle_new_user';

-- 8. Try to manually execute handle_new_user function
-- This simulates what should happen on user creation
DO $$
DECLARE
    test_user RECORD;
BEGIN
    SELECT * INTO test_user
    FROM auth.users 
    WHERE email = 'brian.tanseng@gmail.com'
    LIMIT 1;
    
    IF test_user.id IS NOT NULL THEN
        -- Try to create profile using the function logic
        INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at)
        VALUES (
            test_user.id,
            COALESCE(test_user.raw_user_meta_data->>'first_name', split_part(test_user.email, '@', 1)),
            COALESCE(test_user.raw_user_meta_data->>'last_name', ''),
            COALESCE(test_user.raw_user_meta_data->>'role', 'staff')::user_role,
            true,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            updated_at = NOW();
            
        RAISE NOTICE 'Profile upserted for user %', test_user.email;
    END IF;
END $$;

-- 9. Check auth schema permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.schema_privileges
WHERE schema_name = 'auth'
ORDER BY grantee, privilege_type;

-- 10. Final verification
SELECT 
    'User exists in auth.users' as check_item,
    EXISTS(SELECT 1 FROM auth.users WHERE email = 'brian.tanseng@gmail.com') as status
UNION ALL
SELECT 
    'User has profile',
    EXISTS(
        SELECT 1 FROM public.profiles p 
        JOIN auth.users au ON au.id = p.id 
        WHERE au.email = 'brian.tanseng@gmail.com'
    )
UNION ALL
SELECT 
    'Profile is active',
    EXISTS(
        SELECT 1 FROM public.profiles p 
        JOIN auth.users au ON au.id = p.id 
        WHERE au.email = 'brian.tanseng@gmail.com' 
        AND p.is_active = true
    )
UNION ALL
SELECT 
    'RLS is enabled on profiles',
    rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles';