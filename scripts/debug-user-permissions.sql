-- Debug User Permissions
-- Run this in Supabase Dashboard to check your user's setup

-- 1. Check your current user's profile
SELECT 'Current User Profile' as check_type, 
  p.id, u.email, p.role, p.organization_id, p.is_active
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

-- 2. Check your organization memberships
SELECT 'Organization Memberships' as check_type,
  ou.role, ou.is_primary, ou.is_active,
  o.name as organization_name, o.id as organization_id
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid();

-- 3. Check what permissions your super_user role should have
SELECT 'Super User Permissions' as check_type,
  permission, description, category
FROM role_permissions
WHERE role = 'super_user'
ORDER BY category, permission;

-- 4. Check effective permissions for your user
SELECT 'Your Effective Permissions' as check_type,
  permission, category, permission_source
FROM user_effective_permissions
WHERE user_id = auth.uid()
ORDER BY category, permission;

-- 5. Check if you have cross-org permissions
SELECT 'Cross Org Permissions' as check_type,
  cop.permission_type, cop.permissions, cop.is_active,
  o.name as organization_name
FROM cross_org_permissions cop
JOIN organizations o ON o.id = cop.organization_id
WHERE cop.user_id = auth.uid();