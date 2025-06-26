-- Debug Super User Permissions
-- Run this to see what permissions super_user role has

-- 1. Check what permissions are defined for super_user
SELECT 'Super User Role Permissions' as check_type,
  permission, description, category
FROM role_permissions
WHERE role = 'super_user'
ORDER BY category, permission;

-- 2. Check what the protected routes are looking for vs what super_user has
SELECT 'Permission Mapping Check' as check_type,
  'manage_org_users' as required_permission,
  CASE WHEN EXISTS (SELECT 1 FROM role_permissions WHERE role = 'super_user' AND permission = 'manage_org_users')
       THEN '✅ Has permission'
       ELSE '❌ Missing permission' END as has_permission

UNION ALL

SELECT 'Permission Mapping Check' as check_type,
  'manage_artworks' as required_permission,
  CASE WHEN EXISTS (SELECT 1 FROM role_permissions WHERE role = 'super_user' AND permission = 'manage_artworks')
       THEN '✅ Has permission'
       ELSE '❌ Missing permission' END as has_permission

UNION ALL

SELECT 'Permission Mapping Check' as check_type,
  'manage_nfc_tags' as required_permission,
  CASE WHEN EXISTS (SELECT 1 FROM role_permissions WHERE role = 'super_user' AND permission = 'manage_nfc_tags')
       THEN '✅ Has permission'
       ELSE '❌ Missing permission' END as has_permission;

-- 3. Check what the super_user actually has that might work
SELECT 'Super User Alternatives' as check_type,
  permission
FROM role_permissions
WHERE role = 'super_user' 
  AND (permission LIKE '%users%' 
       OR permission LIKE '%artworks%' 
       OR permission LIKE '%nfc%')
ORDER BY permission;