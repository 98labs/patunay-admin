-- Check how permissions are set up in the database

-- 1. Check if permissions column exists in profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'permissions';

-- 2. Check user_permissions table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_permissions'
ORDER BY ordinal_position;

-- 3. Check if there's a function or view that combines permissions
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%permission%';

-- 4. Check for any views related to users/profiles
SELECT 
    table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND (table_name LIKE '%user%' OR table_name LIKE '%profile%');

-- 5. Check current user's permissions setup
SELECT 
    p.*,
    (SELECT array_agg(permission) FROM public.user_permissions WHERE user_id = p.id) as permissions_from_table
FROM public.profiles p
WHERE p.id = auth.uid();

-- 6. If permissions is a JSON column in profiles, check it
SELECT 
    id,
    email,
    role,
    permissions,
    pg_typeof(permissions) as permissions_type
FROM public.profiles
WHERE id = auth.uid();