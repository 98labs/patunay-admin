-- Fix Issuer Role
-- Run this to check and fix the issuer's role

-- 1. Check current issuer setup
SELECT 'Current Issuer Setup' as check_type,
  p.role as profile_role,
  ou.role as org_role,
  ou.is_primary,
  o.name as org_name
FROM profiles p
JOIN organization_users ou ON ou.user_id = p.id
JOIN organizations o ON o.id = ou.organization_id
WHERE p.id = auth.uid();

-- 2. Check what permissions issuer role should have vs what they might have
SELECT 'Expected Issuer Permissions' as check_type,
  permission, description
FROM role_permissions
WHERE role = 'issuer'
ORDER BY permission;

-- 3. Fix the issuer's organization membership role if it's wrong
UPDATE organization_users 
SET role = 'issuer'
WHERE user_id = auth.uid() 
  AND role != 'issuer';

-- 4. Verify fix
SELECT 'After Fix' as check_type,
  p.role as profile_role,
  ou.role as org_role,
  ou.is_primary,
  o.name as org_name
FROM profiles p
JOIN organization_users ou ON ou.user_id = p.id
JOIN organizations o ON o.id = ou.organization_id
WHERE p.id = auth.uid();