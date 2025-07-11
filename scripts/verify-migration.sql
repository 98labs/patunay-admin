-- Migration Verification Script
-- Run this to verify the multi-tenant RBAC schema was applied correctly

-- Check if new tables exist
SELECT 'organizations' as table_name, count(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'organizations'

UNION ALL

SELECT 'organization_users' as table_name, count(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'organization_users'

UNION ALL

SELECT 'cross_org_permissions' as table_name, count(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'cross_org_permissions'

UNION ALL

SELECT 'role_permissions' as table_name, count(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'role_permissions';

-- Check if new enums exist
SELECT 'organization_type' as enum_name, count(*) as exists
FROM pg_type 
WHERE typname = 'organization_type'

UNION ALL

SELECT 'user_role_new' as enum_name, count(*) as exists
FROM pg_type 
WHERE typname = 'user_role_new'

UNION ALL

SELECT 'cross_org_permission_type' as enum_name, count(*) as exists
FROM pg_type 
WHERE typname = 'cross_org_permission_type';

-- Check if profiles table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('role', 'organization_id');

-- Check if artworks table has organization_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'artworks' 
  AND column_name = 'organization_id';

-- Check role permissions count
SELECT 'role_permissions_count' as check_name, count(*) as value
FROM public.role_permissions;

-- Check if default organization was created
SELECT 'default_org_created' as check_name, count(*) as value
FROM public.organizations 
WHERE name = 'Default Organization';

-- Check if views exist
SELECT 'user_effective_permissions' as view_name, count(*) as exists 
FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'user_effective_permissions'

UNION ALL

SELECT 'user_organizations' as view_name, count(*) as exists 
FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'user_organizations';

-- Check if functions exist
SELECT 'user_has_permission' as function_name, count(*) as exists
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'user_has_permission'

UNION ALL

SELECT 'get_user_role_in_org' as function_name, count(*) as exists
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'get_user_role_in_org'

UNION ALL

SELECT 'can_access_resource' as function_name, count(*) as exists
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'can_access_resource';