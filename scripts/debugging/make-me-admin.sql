-- Quick script to make the current logged-in user an admin
-- Run this while logged into Supabase as your user

-- Step 1: Show current user info
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email,
    p.role as current_role,
    p.first_name,
    p.last_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.id = auth.uid();

-- Step 2: Update current user to admin
UPDATE public.profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE id = auth.uid();

-- Step 3: Verify the update
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    is_active
FROM public.profiles 
WHERE id = auth.uid();

-- Step 4: If you know your email, you can also update by email
-- UPDATE public.profiles 
-- SET role = 'admin'
-- WHERE id IN (
--     SELECT id FROM auth.users WHERE email = 'your-email@example.com'
-- );

-- Step 5: Show all admin users
SELECT 
    p.id,
    au.email,
    p.first_name,
    p.last_name,
    p.role,
    p.is_active,
    p.created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;