-- Fix User Admin Role for Organization Edit Access
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check current user's role in organizations
SELECT 
    'Current User Roles' as check_type,
    ou.organization_id,
    o.name as organization_name,
    ou.user_id,
    p.email as user_email,
    ou.role as current_role,
    ou.is_primary,
    ou.is_active
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
JOIN auth.users au ON au.id = ou.user_id
JOIN profiles p ON p.id = ou.user_id
WHERE au.id = auth.uid()
ORDER BY ou.is_primary DESC, o.name;

-- 2. Update the current user to admin role for their organizations
-- This will give them access to the Edit button
UPDATE organization_users
SET 
    role = 'admin',
    updated_at = NOW()
WHERE 
    user_id = auth.uid()
    AND is_active = true
    AND role NOT IN ('admin', 'super_user'); -- Don't downgrade super_users

-- 3. Verify the update
SELECT 
    'Updated User Roles' as check_type,
    ou.organization_id,
    o.name as organization_name,
    ou.role as new_role,
    ou.permissions
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid()
ORDER BY ou.is_primary DESC, o.name;

-- 4. Alternative: If you want to make a specific user an admin
-- Replace 'user@example.com' with the actual email
/*
UPDATE organization_users ou
SET 
    role = 'admin',
    updated_at = NOW()
FROM profiles p
WHERE 
    p.id = ou.user_id
    AND p.email = 'user@example.com'
    AND ou.is_active = true;
*/

-- 5. Check which permissions the admin role has
SELECT 
    'Admin Role Permissions' as info,
    'admin' as role,
    'manage_org_users, manage_org_artworks, manage_org_nfc_tags, view_org_statistics, manage_org_settings, manage_org_appraisals, grant_cross_org_permissions, manage_locations, view_all_locations' as permissions;