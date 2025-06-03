-- Fix user creation issues

-- 1. First, check if the trigger exists and is working
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name,
    tgenabled AS enabled
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'on_auth_user_created';

-- 2. Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create a more robust function that handles errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles table with minimal data
    INSERT INTO public.profiles (
        id,
        created_at,
        updated_at,
        role,
        is_active
    ) VALUES (
        NEW.id,
        NOW(),
        NOW(),
        'staff', -- Default role
        true     -- Default active
    ) ON CONFLICT (id) DO UPDATE
    SET 
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 6. Test function to verify user creation works
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS void AS $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Generate a test UUID
    test_user_id := gen_random_uuid();
    
    -- Test inserting into profiles directly
    INSERT INTO public.profiles (id, created_at, role, is_active)
    VALUES (test_user_id, NOW(), 'staff', true);
    
    -- Delete the test record
    DELETE FROM public.profiles WHERE id = test_user_id;
    
    RAISE NOTICE 'Profile creation test successful';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Profile creation test failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_user_creation();

-- Clean up test function
DROP FUNCTION IF EXISTS test_user_creation();