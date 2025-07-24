-- Script to ensure the current user has admin privileges in the profiles table

-- First, ensure the current user has a profile with admin role
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found. Please run this script while logged in.';
        RETURN;
    END IF;
    
    -- Check if user already has a profile
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
        -- Update existing profile to admin
        UPDATE public.profiles 
        SET 
            role = 'admin',
            is_active = true,
            updated_at = NOW()
        WHERE id = current_user_id;
        
        RAISE NOTICE 'Updated user % to admin role', current_user_id;
    ELSE
        -- Create new profile with admin role
        INSERT INTO public.profiles (
            id, 
            role, 
            is_active, 
            created_at,
            updated_at
        ) VALUES (
            current_user_id,
            'admin',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created admin profile for user %', current_user_id;
    END IF;
END $$;

-- Verify the update
SELECT 
    id,
    email,
    role,
    is_active,
    first_name,
    last_name
FROM 
    public.profiles 
WHERE 
    id = auth.uid();