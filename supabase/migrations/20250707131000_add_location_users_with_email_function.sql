-- Create function to get location users with email
CREATE OR REPLACE FUNCTION get_location_users_with_email(p_location_id UUID)
RETURNS TABLE (
    id UUID,
    location_id UUID,
    user_id UUID,
    organization_id UUID,
    role user_role,
    permissions TEXT[],
    is_primary_location BOOLEAN,
    can_access_other_locations BOOLEAN,
    department TEXT,
    "position" TEXT,
    employee_id TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by UUID,
    deleted_at TIMESTAMPTZ,
    user_email TEXT,
    user_first_name TEXT,
    user_last_name TEXT,
    user_avatar_url TEXT,
    location_name TEXT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        lu.id,
        lu.location_id,
        lu.user_id,
        lu.organization_id,
        lu.role,
        lu.permissions,
        lu.is_primary_location,
        lu.can_access_other_locations,
        lu.department,
        lu.position,
        lu.employee_id,
        lu.start_date,
        lu.end_date,
        lu.is_active,
        lu.created_at,
        lu.updated_at,
        lu.created_by,
        lu.deleted_at,
        au.email as user_email,
        p.first_name as user_first_name,
        p.last_name as user_last_name,
        p.avatar_url as user_avatar_url,
        l.name as location_name
    FROM location_users lu
    JOIN profiles p ON p.id = lu.user_id
    JOIN auth.users au ON au.id = lu.user_id
    JOIN locations l ON l.id = lu.location_id
    WHERE lu.location_id = p_location_id
        AND lu.deleted_at IS NULL
        AND p.deleted_at IS NULL
    ORDER BY COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '');
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_location_users_with_email TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_location_users_with_email IS 'Get location users with their profile data and email addresses';