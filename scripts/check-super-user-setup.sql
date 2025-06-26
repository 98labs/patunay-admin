-- Check Super User Setup
-- Run this in Supabase Dashboard SQL Editor

-- 1. Your current user profile
SELECT 'Your Profile' as check_type,
  p.id, u.email, p.role, p.organization_id, p.is_active
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

-- 2. Your organization memberships
SELECT 'Your Organizations' as check_type,
  ou.role, ou.is_primary, ou.is_active,
  o.name as org_name, o.id as org_id
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid();

-- 3. Super user permissions defined in system
SELECT 'Super User Permissions in DB' as check_type,
  permission, category
FROM role_permissions
WHERE role = 'super_user'
ORDER BY category, permission;

-- 4. Your effective permissions (should show super_user permissions)
SELECT 'Your Effective Permissions' as check_type,
  permission, permission_source
FROM user_effective_permissions
WHERE user_id = auth.uid()
ORDER BY permission;

-- 5. Check if views are working
SELECT 'View Test' as check_type,
  COUNT(*) as permission_count
FROM user_effective_permissions
WHERE user_id = auth.uid();