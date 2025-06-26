-- Check Current User Role
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check your current user's role
SELECT 'Current User Role' as check_type,
  p.id, u.email, p.role, p.organization_id, p.is_active
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

-- 2. Check your organization membership role
SELECT 'Organization Membership Role' as check_type,
  ou.role, ou.is_primary, ou.is_active,
  o.name as org_name
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid();