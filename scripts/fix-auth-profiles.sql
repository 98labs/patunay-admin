-- Fix authentication issues by ensuring profiles are created for auth users
-- This migration adds the missing handle_new_user function and trigger

-- Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile with default values
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff')::user_role,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE
    SET 
        -- Only update if the existing record has empty first_name/last_name
        first_name = CASE 
            WHEN profiles.first_name IS NULL OR profiles.first_name = '' 
            THEN EXCLUDED.first_name 
            ELSE profiles.first_name 
        END,
        last_name = CASE 
            WHEN profiles.last_name IS NULL OR profiles.last_name = '' 
            THEN EXCLUDED.last_name 
            ELSE profiles.last_name 
        END,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix any existing users who don't have profiles
-- This ensures all auth.users have corresponding profiles
INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    COALESCE(au.raw_user_meta_data->>'role', 'staff')::user_role,
    true,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Create test admin user if needed (only for development)
-- Email: admin@patunay.com
-- Password: admin123
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Check if we're in a development environment (you may want to adjust this check)
    IF current_database() = 'postgres' OR current_database() LIKE '%dev%' THEN
        -- Check if admin user exists
        SELECT id INTO test_user_id FROM auth.users WHERE email = 'admin@patunay.com';
        
        IF test_user_id IS NULL THEN
            -- Note: This won't actually create the auth user - that needs to be done via Supabase Auth
            -- This is just a placeholder to show what credentials to use
            RAISE NOTICE 'To create test admin user, use Supabase dashboard or client with:';
            RAISE NOTICE 'Email: admin@patunay.com';
            RAISE NOTICE 'Password: admin123';
            RAISE NOTICE 'Then run: UPDATE profiles SET role = ''admin'' WHERE id = (SELECT id FROM auth.users WHERE email = ''admin@patunay.com'');';
        ELSE
            -- Update existing user to admin if not already
            UPDATE public.profiles 
            SET role = 'admin', is_active = true 
            WHERE id = test_user_id AND role != 'admin';
        END IF;
    END IF;
END $$;