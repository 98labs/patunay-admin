-- Check Organizations Data
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check if organizations exist
SELECT 'Organizations Count' as check_type, COUNT(*) as count
FROM organizations;

-- 2. List all organizations
SELECT 'All Organizations' as check_type,
  id, name, type, is_active, created_at
FROM organizations
ORDER BY created_at DESC;

-- 3. Check if Default Organization exists
SELECT 'Default Organization' as check_type,
  id, name, type, is_active, created_at
FROM organizations
WHERE name = 'Default Organization';

-- 4. Check RLS policies on organizations table
SELECT 'RLS Policies' as check_type,
  policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'organizations';

-- 5. Test if current user can see organizations
SELECT 'User Access Test' as check_type,
  COUNT(*) as visible_count
FROM organizations
WHERE is_active = true;