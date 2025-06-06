-- Setup permissions for admin users based on the actual database schema
-- The profiles table doesn't have a permissions column, but user_permissions table stores them

-- Step 1: Check current user's role and permissions
DO $$
DECLARE
    current_user_id uuid;
    current_user_role text;
    current_permissions text[];
BEGIN
    -- Get current user info
    SELECT auth.uid() INTO current_user_id;
    
    -- Get current user's role from profiles
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = current_user_id;
    
    -- Get current permissions from user_permissions table
    SELECT array_agg(permission) INTO current_permissions
    FROM public.user_permissions
    WHERE user_id = current_user_id;
    
    RAISE NOTICE 'Current user ID: %', current_user_id;
    RAISE NOTICE 'Current user role: %', current_user_role;
    RAISE NOTICE 'Current permissions: %', current_permissions;
END$$;

-- Step 2: Define default permissions for each role
-- Based on the DEFAULT_PERMISSIONS in the TypeScript code
DO $$
DECLARE
    admin_permissions text[] := ARRAY[
        'manage_users',
        'manage_artworks',
        'manage_nfc_tags',
        'view_statistics',
        'manage_system',
        'manage_appraisals'
    ];
    staff_permissions text[] := ARRAY[
        'manage_artworks',
        'manage_appraisals',
        'view_statistics'
    ];
BEGIN
    RAISE NOTICE 'Admin default permissions: %', admin_permissions;
    RAISE NOTICE 'Staff default permissions: %', staff_permissions;
END$$;

-- Step 3: Grant permissions to all admin users
DO $$
DECLARE
    admin_user RECORD;
    perm text;
    admin_permissions text[] := ARRAY[
        'manage_users',
        'manage_artworks',
        'manage_nfc_tags',
        'view_statistics',
        'manage_system',
        'manage_appraisals'
    ];
BEGIN
    -- For each admin user
    FOR admin_user IN 
        SELECT id, COALESCE(first_name || ' ' || last_name, 'User ' || id) as name 
        FROM public.profiles 
        WHERE role = 'admin' AND is_active = true
    LOOP
        RAISE NOTICE 'Processing admin user: % (%)', admin_user.name, admin_user.id;
        
        -- Clear existing permissions for this user
        DELETE FROM public.user_permissions WHERE user_id = admin_user.id;
        
        -- Add all admin permissions
        FOREACH perm IN ARRAY admin_permissions
        LOOP
            INSERT INTO public.user_permissions (
                user_id,
                permission,
                granted_by,
                created_at,
                updated_at
            ) VALUES (
                admin_user.id,
                perm,
                admin_user.id, -- Self-granted for initial setup
                NOW(),
                NOW()
            ) ON CONFLICT DO NOTHING;
            
            RAISE NOTICE '  - Granted permission: %', perm;
        END LOOP;
    END LOOP;
END$$;

-- Step 4: Grant permissions to all staff users
DO $$
DECLARE
    staff_user RECORD;
    perm text;
    staff_permissions text[] := ARRAY[
        'manage_artworks',
        'manage_appraisals',
        'view_statistics'
    ];
BEGIN
    -- For each staff user
    FOR staff_user IN 
        SELECT id, COALESCE(first_name || ' ' || last_name, 'User ' || id) as name 
        FROM public.profiles 
        WHERE role = 'staff' AND is_active = true
    LOOP
        RAISE NOTICE 'Processing staff user: % (%)', staff_user.name, staff_user.id;
        
        -- Clear existing permissions for this user
        DELETE FROM public.user_permissions WHERE user_id = staff_user.id;
        
        -- Add all staff permissions
        FOREACH perm IN ARRAY staff_permissions
        LOOP
            INSERT INTO public.user_permissions (
                user_id,
                permission,
                granted_by,
                created_at,
                updated_at
            ) VALUES (
                staff_user.id,
                perm,
                staff_user.id, -- Self-granted for initial setup
                NOW(),
                NOW()
            ) ON CONFLICT DO NOTHING;
            
            RAISE NOTICE '  - Granted permission: %', perm;
        END LOOP;
    END LOOP;
END$$;

-- Step 5: Test the get_user_with_role function to see if permissions are properly returned
-- Cast email to text to avoid type mismatch
SELECT 
    id,
    email::text as email,
    first_name,
    last_name,
    role,
    permissions
FROM public.get_user_with_role(auth.uid());

-- Alternative: Query the data directly without the function
-- This avoids the type mismatch issue
SELECT 
    p.id,
    au.email::text as email,
    p.first_name,
    p.last_name,
    p.role,
    ARRAY(
        SELECT permission 
        FROM public.user_permissions 
        WHERE user_id = p.id
        ORDER BY permission
    ) as permissions
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id = auth.uid();

-- Step 6: Verify all admin users have correct permissions
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name as name,
    p.role,
    array_agg(up.permission ORDER BY up.permission) as permissions
FROM public.profiles p
LEFT JOIN public.user_permissions up ON up.user_id = p.id
WHERE p.role = 'admin'
GROUP BY p.id, p.first_name, p.last_name, p.role
ORDER BY p.created_at;

-- Step 7: Verify all staff users have correct permissions
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name as name,
    p.role,
    array_agg(up.permission ORDER BY up.permission) as permissions
FROM public.profiles p
LEFT JOIN public.user_permissions up ON up.user_id = p.id
WHERE p.role = 'staff'
GROUP BY p.id, p.first_name, p.last_name, p.role
ORDER BY p.created_at;

-- Step 8: Show summary
DO $$
DECLARE
    admin_count integer;
    staff_count integer;
    total_permissions integer;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin' AND is_active = true;
    SELECT COUNT(*) INTO staff_count FROM public.profiles WHERE role = 'staff' AND is_active = true;
    SELECT COUNT(*) INTO total_permissions FROM public.user_permissions;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Summary ===';
    RAISE NOTICE 'Active admin users: %', admin_count;
    RAISE NOTICE 'Active staff users: %', staff_count;
    RAISE NOTICE 'Total permissions granted: %', total_permissions;
    RAISE NOTICE '';
    RAISE NOTICE 'Admin users should have 6 permissions each.';
    RAISE NOTICE 'Staff users should have 3 permissions each.';
END$$;