-- Comprehensive fix for location_users RLS infinite recursion issue

-- First, drop ALL existing policies on location_users
DROP POLICY IF EXISTS "Super users have full access to location_users" ON location_users;
DROP POLICY IF EXISTS "Org admins can manage location assignments" ON location_users;
DROP POLICY IF EXISTS "Location managers can manage their location users" ON location_users;
DROP POLICY IF EXISTS "Users can view their own location assignments" ON location_users;
DROP POLICY IF EXISTS "Users can view other users in same location" ON location_users;
DROP POLICY IF EXISTS "Super users full access to location_users" ON location_users;
DROP POLICY IF EXISTS "Org admins manage location assignments" ON location_users;
DROP POLICY IF EXISTS "Location managers manage their users" ON location_users;
DROP POLICY IF EXISTS "Users view own assignments only" ON location_users;

-- Create simplified policies without any self-referencing

-- 1. Super users can do everything
CREATE POLICY "location_users_super_admin_all" ON location_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_user'
        )
    );

-- 2. Organization admins can manage their org's location assignments
CREATE POLICY "location_users_org_admin_all" ON location_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = location_users.organization_id
            AND ou.role = 'admin'
            AND ou.is_active = true
        )
    );

-- 3. Location managers can manage users in their locations
CREATE POLICY "location_users_manager_all" ON location_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM locations l
            WHERE l.id = location_users.location_id
            AND l.manager_id = auth.uid()
        )
    );

-- 4. Users can only view their own assignments
CREATE POLICY "location_users_self_select" ON location_users
    FOR SELECT TO authenticated
    USING (
        location_users.user_id = auth.uid()
    );

-- Create a function to safely get users in same locations
CREATE OR REPLACE FUNCTION get_users_in_my_locations()
RETURNS TABLE (
    id UUID,
    location_id UUID,
    user_id UUID,
    organization_id UUID,
    role user_role,
    permissions TEXT[],
    is_primary_location BOOLEAN,
    can_access_other_locations BOOLEAN,
    department VARCHAR(100),
    "position" VARCHAR(100),
    employee_id VARCHAR(50),
    is_active BOOLEAN,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by UUID,
    deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT lu2.*
    FROM location_users lu1
    JOIN location_users lu2 ON lu1.location_id = lu2.location_id
    WHERE lu1.user_id = auth.uid()
    AND lu1.is_active = true
    AND lu2.is_active = true
    AND lu1.deleted_at IS NULL
    AND lu2.deleted_at IS NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_users_in_my_locations() TO authenticated;

-- Create a simple function to check if a user belongs to a location
CREATE OR REPLACE FUNCTION is_user_in_location(p_user_id UUID, p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM location_users lu
        WHERE lu.user_id = p_user_id
        AND lu.location_id = p_location_id
        AND lu.is_active = true
        AND lu.deleted_at IS NULL
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_user_in_location(UUID, UUID) TO authenticated;