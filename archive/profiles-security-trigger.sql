-- Create a trigger to prevent non-admin users from changing certain fields
-- This complements the RLS policies

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_unauthorized_profile_changes ON public.profiles;
DROP FUNCTION IF EXISTS check_profile_update_permissions();

-- Create function to check profile update permissions
CREATE OR REPLACE FUNCTION check_profile_update_permissions()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Get the current user's role
    SELECT role INTO current_user_role 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- If the user is not an admin, prevent them from changing certain fields
    IF current_user_role != 'admin' OR current_user_role IS NULL THEN
        -- Check if user is trying to change their own sensitive fields
        IF NEW.id = auth.uid() THEN
            -- Prevent changing own role
            IF NEW.role IS DISTINCT FROM OLD.role THEN
                RAISE EXCEPTION 'You cannot change your own role';
            END IF;
            
            -- Prevent changing own active status
            IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
                RAISE EXCEPTION 'You cannot change your own active status';
            END IF;
        ELSE
            -- Non-admins cannot update other users at all
            -- This should be caught by RLS, but adding as extra security
            RAISE EXCEPTION 'You do not have permission to update other users';
        END IF;
    END IF;

    -- Allow the update to proceed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER prevent_unauthorized_profile_changes
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_profile_update_permissions();

-- Add comment
COMMENT ON FUNCTION check_profile_update_permissions() IS 'Prevents non-admin users from changing sensitive fields in their profile';