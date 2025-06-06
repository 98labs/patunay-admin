-- Check your current user status
-- Run this while logged in as brian.tanseng@gmail.com

-- 1. Show your auth user ID
SELECT 
    auth.uid() as your_user_id,
    auth.email() as your_email;

-- 2. Check if you have a profile
SELECT 
    'Profile exists?' as check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) 
        THEN 'YES' 
        ELSE 'NO - This is the problem!' 
    END as result;

-- 3. Show your profile data (if it exists)
SELECT 
    id,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
FROM public.profiles
WHERE id = auth.uid();

-- 4. If no profile exists, create one
-- IMPORTANT: Uncomment and run this if step 2 shows "NO"
/*
INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    auth.uid(),
    'Brian',
    'Tanseng',
    'admin'::user_role,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin'::user_role,
    is_active = true,
    updated_at = NOW();
*/

-- 5. Show your permissions
SELECT 
    up.permission,
    up.created_at,
    up.granted_by
FROM public.user_permissions up
WHERE up.user_id = auth.uid()
ORDER BY up.permission;

-- 6. Count your permissions
SELECT 
    'Permission count' as check,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 6 THEN 'Good - Admin permissions set'
        WHEN COUNT(*) > 0 THEN 'Some permissions exist'
        ELSE 'No permissions - Run setup-admin-permissions.sql'
    END as status
FROM public.user_permissions
WHERE user_id = auth.uid();

-- 7. Test the get_user_with_role function
-- This might fail if there's no profile
SELECT 
    'get_user_with_role test' as test,
    (SELECT COUNT(*) FROM public.get_user_with_role(auth.uid())) as rows_returned;