-- Create Super User Profile Directly
-- Run this in Supabase Dashboard SQL Editor

-- First, let's see what we're working with
SELECT 'Current Auth User' as info,
  id, email, created_at
FROM auth.users
WHERE id = auth.uid();

-- Get the default organization ID
SELECT 'Default Organization' as info,
  id, name
FROM organizations
WHERE name = 'Default Organization';

-- Create the profile directly (replace YOUR_EMAIL with your actual email)
-- You'll need to run this part manually with your email
INSERT INTO profiles (id, role, organization_id, is_active, created_at, updated_at)
SELECT 
  u.id,
  'super_user'::user_role_new,
  o.id,
  true,
  now(),
  now()
FROM auth.users u
CROSS JOIN organizations o
WHERE u.id = auth.uid()
  AND o.name = 'Default Organization'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- Create organization membership
INSERT INTO organization_users (organization_id, user_id, role, is_primary, is_active, created_at)
SELECT 
  o.id,
  u.id,
  'super_user'::user_role_new,
  true,
  true,
  now()
FROM auth.users u
CROSS JOIN organizations o
WHERE u.id = auth.uid()
  AND o.name = 'Default Organization'
  AND NOT EXISTS (SELECT 1 FROM organization_users WHERE user_id = u.id);

-- Verify everything was created
SELECT 'Final Check - Profile' as check_type,
  p.id, p.role, p.organization_id, p.is_active,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

SELECT 'Final Check - Org Membership' as check_type,
  ou.role, ou.is_primary, ou.is_active,
  o.name as org_name
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid();