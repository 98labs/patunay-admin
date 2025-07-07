-- Only create the email function, don't touch existing policies

-- Create function to get organization users with email
CREATE OR REPLACE FUNCTION get_organization_users_with_email(p_organization_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role user_role_new
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id as user_id,
        au.email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        ou.role
    FROM organization_users ou
    JOIN profiles p ON p.id = ou.user_id
    JOIN auth.users au ON au.id = p.id
    WHERE ou.organization_id = p_organization_id
        AND ou.is_active = true
        AND p.deleted_at IS NULL
        AND au.deleted_at IS NULL
    ORDER BY COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '');
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_users_with_email TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_organization_users_with_email IS 'Get organization users with their profile data and email addresses';