-- Manual user creation function that bypasses the admin API issues
-- This can be used as a temporary workaround

-- Function to manually create a user
CREATE OR REPLACE FUNCTION create_user_manually(
    user_email TEXT,
    user_password TEXT,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'staff',
    user_phone TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Note: This function creates a user in the profiles table only
    -- The actual auth user must be created through Supabase Auth
    
    -- Generate a UUID for the new user
    new_user_id := gen_random_uuid();
    
    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        role,
        phone,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        first_name,
        last_name,
        user_role,
        user_phone,
        true,
        NOW(),
        NOW()
    );
    
    -- Return the created user info
    result := json_build_object(
        'id', new_user_id,
        'email', user_email,
        'first_name', first_name,
        'last_name', last_name,
        'role', user_role,
        'message', 'Profile created. Use Supabase dashboard to create auth user with this ID: ' || new_user_id::text
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_manually(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Example usage:
-- SELECT create_user_manually('user@example.com', 'password123', 'John', 'Doe', 'staff', '+1234567890');