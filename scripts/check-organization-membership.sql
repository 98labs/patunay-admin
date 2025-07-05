-- Check Organization Membership
-- Run this in Supabase Dashboard SQL Editor

-- Check what role you have in organization_users table
SELECT 'Organization Membership' as check_type,
  ou.role as org_role,
  p.role as profile_role,
  ou.is_primary,
  ou.is_active,
  o.name as org_name
FROM organization_users ou
JOIN profiles p ON p.id = ou.user_id
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid();