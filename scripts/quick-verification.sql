-- Quick Migration Verification
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check all new tables exist
SELECT 'New Tables' as check_type, 
  CASE WHEN COUNT(*) = 4 THEN '✅ All 4 tables created' 
       ELSE '❌ Missing tables' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_users', 'cross_org_permissions', 'role_permissions');

-- 2. Check role permissions loaded
SELECT 'Role Permissions' as check_type,
  CASE WHEN COUNT(*) >= 24 THEN '✅ ' || COUNT(*) || ' permissions loaded'
       ELSE '❌ Missing permissions' END as status
FROM role_permissions;

-- 3. Check default organization
SELECT 'Default Org' as check_type,
  CASE WHEN COUNT(*) = 1 THEN '✅ Default organization created'
       ELSE '❌ No default organization' END as status
FROM organizations WHERE name = 'Default Organization';

-- 4. Check user migration
SELECT 'User Migration' as check_type,
  CASE WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' users migrated'
       ELSE '❌ No users migrated' END as status
FROM organization_users;

-- 5. Check artwork migration
SELECT 'Artwork Migration' as check_type,
  CASE WHEN COUNT(organization_id) = COUNT(*) THEN '✅ All ' || COUNT(*) || ' artworks have organization'
       ELSE '❌ Some artworks missing organization' END as status
FROM artworks;