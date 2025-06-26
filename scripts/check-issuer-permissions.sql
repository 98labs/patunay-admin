-- Check Issuer Permissions
-- Run this to see what permissions the issuer actually has

-- 1. Check issuer's role and org membership
SELECT 'Issuer Role Check' as check_type,
  p.role as profile_role,
  ou.role as org_role,
  ou.is_primary,
  o.name as org_name
FROM profiles p
JOIN organization_users ou ON ou.user_id = p.id
JOIN organizations o ON o.id = ou.organization_id
WHERE p.id = auth.uid();

-- 2. Check what permissions issuer role should have
SELECT 'Issuer Role Permissions' as check_type,
  permission, description, category
FROM role_permissions
WHERE role = 'issuer'
ORDER BY category, permission;

-- 3. Check effective permissions for current user
SELECT 'Your Effective Permissions' as check_type,
  permission, permission_source
FROM user_effective_permissions
WHERE user_id = auth.uid()
ORDER BY permission;