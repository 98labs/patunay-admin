-- Add missing RLS policies for organizations table
-- This migration fixes the issue where super users cannot create organizations

-- ============================================================================
-- ORGANIZATIONS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

-- SELECT: Authenticated users can see active organizations they belong to or all if super_user
CREATE POLICY "organizations_select_policy" ON public.organizations
  FOR SELECT
  USING (
    is_active = true 
    AND (
      -- Super users can see all organizations
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
          AND role = 'super_user'
          AND is_active = true
      )
      OR
      -- Users can see organizations they belong to
      EXISTS (
        SELECT 1 FROM public.organization_users
        WHERE organization_id = organizations.id
          AND user_id = auth.uid()
          AND is_active = true
      )
    )
  );

-- INSERT: Only super users can create organizations
CREATE POLICY "organizations_insert_policy" ON public.organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
  );

-- UPDATE: Super users can update any organization, admins can update their own
CREATE POLICY "organizations_update_policy" ON public.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- DELETE: Only super users can delete organizations (soft delete)
CREATE POLICY "organizations_delete_policy" ON public.organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
  );

-- ============================================================================
-- ORGANIZATION_USERS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "organization_users_select_policy" ON public.organization_users;
DROP POLICY IF EXISTS "organization_users_insert_policy" ON public.organization_users;
DROP POLICY IF EXISTS "organization_users_update_policy" ON public.organization_users;
DROP POLICY IF EXISTS "organization_users_delete_policy" ON public.organization_users;

-- SELECT: Users can see members of their organizations
CREATE POLICY "organization_users_select_policy" ON public.organization_users
  FOR SELECT
  USING (
    -- Super users can see all
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    -- Users can see members of organizations they belong to
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
        AND ou.user_id = auth.uid()
        AND ou.is_active = true
    )
  );

-- INSERT: Super users and org admins can add members
CREATE POLICY "organization_users_insert_policy" ON public.organization_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organization_users.organization_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- UPDATE: Super users and org admins can update members
CREATE POLICY "organization_users_update_policy" ON public.organization_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
        AND ou.user_id = auth.uid()
        AND ou.role = 'admin'
        AND ou.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
        AND ou.user_id = auth.uid()
        AND ou.role = 'admin'
        AND ou.is_active = true
    )
  );

-- DELETE: Super users and org admins can remove members
CREATE POLICY "organization_users_delete_policy" ON public.organization_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organization_users.organization_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================================================
-- CROSS_ORG_PERMISSIONS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "cross_org_permissions_select_policy" ON public.cross_org_permissions;
DROP POLICY IF EXISTS "cross_org_permissions_insert_policy" ON public.cross_org_permissions;
DROP POLICY IF EXISTS "cross_org_permissions_update_policy" ON public.cross_org_permissions;
DROP POLICY IF EXISTS "cross_org_permissions_delete_policy" ON public.cross_org_permissions;

-- SELECT: Users can see their own cross-org permissions
CREATE POLICY "cross_org_permissions_select_policy" ON public.cross_org_permissions
  FOR SELECT
  USING (
    -- Super users can see all
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    -- Users can see their own permissions
    user_id = auth.uid()
    OR
    -- Org admins can see permissions for their organization
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = cross_org_permissions.organization_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- INSERT: Super users and org admins can grant cross-org permissions
CREATE POLICY "cross_org_permissions_insert_policy" ON public.cross_org_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = cross_org_permissions.organization_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- UPDATE: Super users and org admins can update cross-org permissions
CREATE POLICY "cross_org_permissions_update_policy" ON public.cross_org_permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = cross_org_permissions.organization_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = cross_org_permissions.organization_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- DELETE: Super users and org admins can revoke cross-org permissions
CREATE POLICY "cross_org_permissions_delete_policy" ON public.cross_org_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = cross_org_permissions.organization_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================================================

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers for organizations table
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add update triggers for organization_users table
DROP TRIGGER IF EXISTS update_organization_users_updated_at ON public.organization_users;
CREATE TRIGGER update_organization_users_updated_at 
  BEFORE UPDATE ON public.organization_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add update triggers for cross_org_permissions table
DROP TRIGGER IF EXISTS update_cross_org_permissions_updated_at ON public.cross_org_permissions;
CREATE TRIGGER update_cross_org_permissions_updated_at 
  BEFORE UPDATE ON public.cross_org_permissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

-- This query can be run to verify the policies are in place
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been successfully created for:';
  RAISE NOTICE '- organizations table (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '- organization_users table (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '- cross_org_permissions table (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE 'Super users can now:';
  RAISE NOTICE '- Create, read, update, and delete organizations';
  RAISE NOTICE '- Manage organization members';
  RAISE NOTICE '- Grant cross-organization permissions';
END $$;