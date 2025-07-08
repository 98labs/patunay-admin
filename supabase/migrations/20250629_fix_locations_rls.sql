-- Fix infinite recursion in locations table RLS policies

-- Drop existing policies on locations table
DROP POLICY IF EXISTS "Super users have full access to locations" ON locations;
DROP POLICY IF EXISTS "Org admins can manage their locations" ON locations;
DROP POLICY IF EXISTS "Users can view their assigned locations" ON locations;
DROP POLICY IF EXISTS "Location managers can update their location" ON locations;

-- Recreate policies without circular references

-- 1. Super users can do everything
CREATE POLICY "locations_super_admin_all" ON locations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_user'
        )
    );

-- 2. Organization admins can manage their org's locations
CREATE POLICY "locations_org_admin_all" ON locations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = locations.organization_id
            AND ou.role = 'admin'
            AND ou.is_active = true
        )
    );

-- 3. Users with specific organization permissions can view locations
CREATE POLICY "locations_org_users_select" ON locations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = locations.organization_id
            AND ou.is_active = true
            AND (
                ou.permissions && ARRAY['view_all_locations', 'manage_locations']
                OR ou.role IN ('admin', 'staff')
            )
        )
    );

-- 4. Location managers can update their own location
CREATE POLICY "locations_manager_update" ON locations
    FOR UPDATE TO authenticated
    USING (
        locations.manager_id = auth.uid()
    );

-- Create a function to check if a user has access to a location
-- This avoids circular RLS checks
CREATE OR REPLACE FUNCTION user_can_access_location(p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_org_id UUID;
BEGIN
    -- Get the organization_id for this location
    SELECT organization_id INTO v_org_id
    FROM locations
    WHERE id = p_location_id;
    
    -- Check if user is super admin
    IF EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'super_user'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is org admin or has org-wide location permissions
    IF EXISTS (
        SELECT 1 FROM organization_users ou
        WHERE ou.user_id = auth.uid()
        AND ou.organization_id = v_org_id
        AND ou.is_active = true
        AND (
            ou.role = 'admin'
            OR ou.permissions && ARRAY['view_all_locations', 'manage_locations']
        )
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is assigned to this specific location
    IF EXISTS (
        SELECT 1 FROM location_users lu
        WHERE lu.user_id = auth.uid()
        AND lu.location_id = p_location_id
        AND lu.is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is the location manager
    IF EXISTS (
        SELECT 1 FROM locations l
        WHERE l.id = p_location_id
        AND l.manager_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_can_access_location(UUID) TO authenticated;

-- Create a view for easily accessible locations
CREATE OR REPLACE VIEW my_accessible_locations AS
SELECT l.*
FROM locations l
WHERE user_can_access_location(l.id);

-- Grant select on the view
GRANT SELECT ON my_accessible_locations TO authenticated;