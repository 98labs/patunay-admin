-- User Management Schema Extensions
-- Add role management to the existing schema

-- =====================================================
-- USER ROLES ENUM
-- =====================================================
CREATE TYPE user_role AS ENUM ('admin', 'staff');

-- =====================================================
-- EXTEND PROFILES TABLE WITH ROLE MANAGEMENT
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

-- =====================================================
-- USER PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    permission text NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, permission)
);

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token text,
    ip_address inet,
    user_agent text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- FUNCTIONS FOR USER MANAGEMENT
-- =====================================================

-- Function to get user with role and permissions
CREATE OR REPLACE FUNCTION get_user_with_role(user_id uuid)
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    role user_role,
    is_active boolean,
    phone text,
    avatar_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_login_at timestamp with time zone,
    permissions text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        p.first_name,
        p.last_name,
        p.role,
        p.is_active,
        p.phone,
        p.avatar_url,
        p.created_at,
        p.updated_at,
        p.last_login_at,
        ARRAY(
            SELECT up.permission 
            FROM user_permissions up 
            WHERE up.user_id = au.id
        ) as permissions
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.id = user_id;
END;
$$;

-- Function to list all users with roles
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    role user_role,
    is_active boolean,
    phone text,
    avatar_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_login_at timestamp with time zone,
    email_confirmed_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        p.first_name,
        p.last_name,
        COALESCE(p.role, 'staff'::user_role) as role,
        COALESCE(p.is_active, true) as is_active,
        p.phone,
        p.avatar_url,
        p.created_at,
        p.updated_at,
        p.last_login_at,
        au.email_confirmed_at
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.deleted_at IS NULL
    ORDER BY p.created_at DESC;
END;
$$;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id uuid,
    new_role user_role,
    updated_by_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updater_role user_role;
BEGIN
    -- Check if the updater is an admin
    SELECT p.role INTO updater_role
    FROM profiles p
    WHERE p.id = updated_by_user_id;
    
    IF updater_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;
    
    -- Update the user role
    UPDATE profiles 
    SET 
        role = new_role,
        updated_at = now(),
        updated_by = updated_by_user_id
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- Function to deactivate/activate user
CREATE OR REPLACE FUNCTION update_user_status(
    target_user_id uuid,
    new_status boolean,
    updated_by_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updater_role user_role;
BEGIN
    -- Check if the updater is an admin
    SELECT p.role INTO updater_role
    FROM profiles p
    WHERE p.id = updated_by_user_id;
    
    IF updater_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update user status';
    END IF;
    
    -- Update the user status
    UPDATE profiles 
    SET 
        is_active = new_status,
        updated_at = now(),
        updated_by = updated_by_user_id
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- Function to grant permission to user
CREATE OR REPLACE FUNCTION grant_user_permission(
    target_user_id uuid,
    permission_name text,
    granted_by_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    granter_role user_role;
BEGIN
    -- Check if the granter is an admin
    SELECT p.role INTO granter_role
    FROM profiles p
    WHERE p.id = granted_by_user_id;
    
    IF granter_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can grant permissions';
    END IF;
    
    -- Insert or update permission
    INSERT INTO user_permissions (user_id, permission, granted_by, created_at, updated_at)
    VALUES (target_user_id, permission_name, granted_by_user_id, now(), now())
    ON CONFLICT (user_id, permission) 
    DO UPDATE SET 
        granted_by = granted_by_user_id,
        updated_at = now();
    
    RETURN true;
END;
$$;

-- Function to revoke permission from user
CREATE OR REPLACE FUNCTION revoke_user_permission(
    target_user_id uuid,
    permission_name text,
    revoked_by_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    revoker_role user_role;
BEGIN
    -- Check if the revoker is an admin
    SELECT p.role INTO revoker_role
    FROM profiles p
    WHERE p.id = revoked_by_user_id;
    
    IF revoker_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can revoke permissions';
    END IF;
    
    -- Delete permission
    DELETE FROM user_permissions 
    WHERE user_id = target_user_id AND permission = permission_name;
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- TRIGGERS FOR USER MANAGEMENT
-- =====================================================

-- Trigger to update last_login_at when user signs in
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET last_login_at = now() 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.sessions (if it exists, otherwise skip)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'sessions') THEN
        DROP TRIGGER IF EXISTS trigger_update_last_login ON auth.sessions;
        CREATE TRIGGER trigger_update_last_login
            AFTER INSERT ON auth.sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_last_login();
    END IF;
END $$;

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for user_permissions (admins can see all, users can see their own)
CREATE POLICY "Admins can manage all permissions" 
ON user_permissions 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Users can view their own permissions" 
ON user_permissions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Policy for user_sessions (admins can see all, users can see their own)
CREATE POLICY "Admins can manage all sessions" 
ON user_sessions 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Users can view their own sessions" 
ON user_sessions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_user_with_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(uuid, user_role, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_status(uuid, boolean, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_user_permission(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_permission(uuid, text, uuid) TO authenticated;

-- Grant to service role
GRANT ALL ON user_permissions TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create default permissions
INSERT INTO user_permissions (user_id, permission, granted_by) 
SELECT 
    p.id,
    'manage_artworks',
    p.id
FROM profiles p 
WHERE p.role = 'admin'
ON CONFLICT (user_id, permission) DO NOTHING;

COMMENT ON TABLE user_permissions IS 'User-specific permissions for fine-grained access control';
COMMENT ON TABLE user_sessions IS 'User session tracking for security and analytics';
COMMENT ON FUNCTION get_user_with_role(uuid) IS 'Get user details with role and permissions';
COMMENT ON FUNCTION get_all_users_with_roles() IS 'Get all users with their roles for admin management';