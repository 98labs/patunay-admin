-- Quick check of current user data
-- Run this in Supabase Dashboard SQL Editor

SELECT 
  'Your Current User' as info,
  p.id,
  u.email,
  p.role,
  p.organization_id,
  p.is_active,
  o.name as organization_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.id = auth.uid();