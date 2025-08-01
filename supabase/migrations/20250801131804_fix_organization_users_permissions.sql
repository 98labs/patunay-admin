-- Migration: Fix organization_users permissions and add function for user-organization association
-- Date: 2025-08-01
-- Description: Updates RLS policies and creates a SECURITY DEFINER function to allow admins to add users to organizations

-- 1. First, let's check and drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "authenticated_can_view_active_org_members" ON organization_users;
    DROP POLICY IF EXISTS "admins_can_insert_org_members" ON organization_users;
    DROP POLICY IF EXISTS "admins_can_update_org_members" ON organization_users;
    DROP POLICY IF EXISTS "admins_can_delete_org_members" ON organization_users;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- 2. Create new RLS policies for organization_users table

-- Allow authenticated users to view active organization members
CREATE POLICY "authenticated_can_view_active_org_members" ON organization_users
    FOR SELECT
    USING (
        auth.role() = 'authenticated' 
        AND is_active = true
    );

-- Allow organization admins and super users to insert new members
CREATE POLICY "admins_can_insert_org_members" ON organization_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'super_user'::user_role_new
                OR (
                    profiles.role = 'admin'::user_role_new
                    AND EXISTS (
                        SELECT 1 FROM organization_users ou
                        WHERE ou.user_id = auth.uid()
                        AND ou.organization_id = organization_users.organization_id
                        AND ou.role = 'admin'::user_role_new
                        AND ou.is_active = true
                    )
                )
            )
        )
    );

-- Allow organization admins and super users to update members
CREATE POLICY "admins_can_update_org_members" ON organization_users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'super_user'::user_role_new
                OR (
                    profiles.role = 'admin'::user_role_new
                    AND EXISTS (
                        SELECT 1 FROM organization_users ou
                        WHERE ou.user_id = auth.uid()
                        AND ou.organization_id = organization_users.organization_id
                        AND ou.role = 'admin'::user_role_new
                        AND ou.is_active = true
                    )
                )
            )
        )
    );

-- Allow organization admins and super users to delete members
CREATE POLICY "admins_can_delete_org_members" ON organization_users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'super_user'::user_role_new
                OR (
                    profiles.role = 'admin'::user_role_new
                    AND EXISTS (
                        SELECT 1 FROM organization_users ou
                        WHERE ou.user_id = auth.uid()
                        AND ou.organization_id = organization_users.organization_id
                        AND ou.role = 'admin'::user_role_new
                        AND ou.is_active = true
                    )
                )
            )
        )
    );

-- 3. Create a SECURITY DEFINER function to add users to organizations
-- This function bypasses RLS and allows authorized users to add members to organizations

CREATE OR REPLACE FUNCTION add_user_to_organization(
    p_user_id UUID,
    p_organization_id UUID,
    p_role TEXT DEFAULT 'staff',
    p_permissions TEXT[] DEFAULT '{}',
    p_is_primary BOOLEAN DEFAULT true
)
RETURNS organization_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id UUID;
    v_current_user_role user_role_new;
    v_is_org_admin BOOLEAN;
    v_result organization_users;
BEGIN
    -- Get current user ID and role
    v_current_user_id := auth.uid();
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get current user's role
    SELECT role INTO v_current_user_role
    FROM profiles
    WHERE id = v_current_user_id;
    
    -- Check if current user is an admin of the target organization
    SELECT EXISTS (
        SELECT 1 FROM organization_users
        WHERE user_id = v_current_user_id
        AND organization_id = p_organization_id
        AND role = 'admin'::user_role_new
        AND is_active = true
    ) INTO v_is_org_admin;
    
    -- Authorization check: must be super_user or admin of the organization
    IF v_current_user_role != 'super_user'::user_role_new AND NOT v_is_org_admin THEN
        RAISE EXCEPTION 'Insufficient permissions to add users to this organization';
    END IF;
    
    -- Check if user already exists in the organization
    IF EXISTS (
        SELECT 1 FROM organization_users
        WHERE user_id = p_user_id
        AND organization_id = p_organization_id
    ) THEN
        RAISE EXCEPTION 'User is already a member of this organization';
    END IF;
    
    -- Insert the new organization user
    INSERT INTO organization_users (
        user_id,
        organization_id,
        role,
        permissions,
        is_primary,
        is_active,
        created_by,
        created_at
    ) VALUES (
        p_user_id,
        p_organization_id,
        p_role::user_role_new,
        p_permissions,
        p_is_primary,
        true,
        v_current_user_id,
        NOW()
    )
    RETURNING * INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to add user to organization: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_user_to_organization TO authenticated;

-- 4. Create a function to update organization membership
CREATE OR REPLACE FUNCTION update_organization_membership(
    p_membership_id UUID,
    p_role TEXT DEFAULT NULL,
    p_permissions TEXT[] DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS organization_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_user_id UUID;
    v_current_user_role user_role_new;
    v_is_org_admin BOOLEAN;
    v_organization_id UUID;
    v_result organization_users;
BEGIN
    -- Get current user ID and role
    v_current_user_id := auth.uid();
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get the organization_id for this membership
    SELECT organization_id INTO v_organization_id
    FROM organization_users
    WHERE id = p_membership_id;
    
    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION 'Membership not found';
    END IF;
    
    -- Get current user's role
    SELECT role INTO v_current_user_role
    FROM profiles
    WHERE id = v_current_user_id;
    
    -- Check if current user is an admin of the organization
    SELECT EXISTS (
        SELECT 1 FROM organization_users
        WHERE user_id = v_current_user_id
        AND organization_id = v_organization_id
        AND role = 'admin'::user_role_new
        AND is_active = true
    ) INTO v_is_org_admin;
    
    -- Authorization check
    IF v_current_user_role != 'super_user'::user_role_new AND NOT v_is_org_admin THEN
        RAISE EXCEPTION 'Insufficient permissions to update organization membership';
    END IF;
    
    -- Update the membership
    UPDATE organization_users
    SET 
        role = COALESCE(p_role::user_role_new, role),
        permissions = COALESCE(p_permissions, permissions),
        is_active = COALESCE(p_is_active, is_active),
        updated_by = v_current_user_id,
        updated_at = NOW()
    WHERE id = p_membership_id
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_organization_membership TO authenticated;

-- 5. Add helpful comment
COMMENT ON FUNCTION add_user_to_organization IS 'Adds a user to an organization. Requires super_user role or admin role in the target organization.';
COMMENT ON FUNCTION update_organization_membership IS 'Updates an organization membership. Requires super_user role or admin role in the organization.';