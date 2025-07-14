-- URGENT FIX FOR LOGIN ERROR
-- Run these commands in order in Supabase SQL Editor

-- 1. First, disable RLS to avoid permission issues
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Create profile for brian.tanseng@gmail.com
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO user_id FROM auth.users WHERE email = 'brian.tanseng@gmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Delete existing profile if any (to start fresh)
        DELETE FROM public.profiles WHERE id = user_id;
        
        -- Create new profile
        INSERT INTO public.profiles (
            id, 
            first_name, 
            last_name, 
            role, 
            is_active, 
            created_at,
            updated_at
        ) VALUES (
            user_id,
            'Brian',
            'Tanseng',
            'admin'::user_role,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Profile created successfully for brian.tanseng@gmail.com';
    ELSE
        RAISE NOTICE 'User not found in auth.users';
    END IF;
END $$;

-- 3. Verify the profile was created
SELECT 
    au.email,
    p.*
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'brian.tanseng@gmail.com';

-- If the above returns a row, try logging in now.
-- If it still doesn't work, continue with step 4:

-- 4. Create a completely new user as a workaround
-- Go to Supabase Dashboard > Authentication > Users
-- Click "Add user" and create:
-- Email: admin@patunay.com
-- Password: [choose a secure password]
-- Then run:

/*
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Get the new user's ID
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@patunay.com';
    
    IF new_user_id IS NOT NULL THEN
        -- Create profile for new user
        INSERT INTO public.profiles (
            id, 
            first_name, 
            last_name, 
            role, 
            is_active, 
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            'Admin',
            'User',
            'admin'::user_role,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin'::user_role, is_active = true;
        
        RAISE NOTICE 'Admin profile created for admin@patunay.com';
    END IF;
END $$;
*/