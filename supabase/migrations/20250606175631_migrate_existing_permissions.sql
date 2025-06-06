-- Migrate existing users and permissions to the new authz system
-- This migration should run after the authz schema is created

-- Function to migrate a user's role to authz system
CREATE OR REPLACE FUNCTION authz.migrate_user_role(p_user_id uuid, p_role text)
RETURNS void AS $$
BEGIN
    -- Add user to appropriate group based on their role
    IF p_role = 'admin' THEN
        INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
        VALUES ('group', 'admins', 'member', 'user', p_user_id::text)
        ON CONFLICT DO NOTHING;
    ELSIF p_role = 'staff' THEN
        INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
        VALUES ('group', 'staff', 'member', 'user', p_user_id::text)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Migrate all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Migrate users based on their roles in the profiles table
    FOR user_record IN 
        SELECT id, role FROM profiles WHERE role IS NOT NULL
    LOOP
        PERFORM authz.migrate_user_role(user_record.id, user_record.role);
    END LOOP;
    
    -- Also migrate any individual permissions from user_permissions table
    FOR user_record IN
        SELECT DISTINCT user_id, permission FROM user_permissions
    LOOP
        -- Map old permissions to new authz tuples
        CASE user_record.permission
            WHEN 'manage_users' THEN
                INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
                VALUES ('system', 'global', 'user_manager', 'user', user_record.user_id::text)
                ON CONFLICT DO NOTHING;
            WHEN 'manage_artworks' THEN
                INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
                VALUES ('artwork', '*', 'editor', 'user', user_record.user_id::text)
                ON CONFLICT DO NOTHING;
            WHEN 'manage_nfc_tags' THEN
                INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
                VALUES ('nfc_tag', '*', 'manager', 'user', user_record.user_id::text)
                ON CONFLICT DO NOTHING;
            WHEN 'view_statistics' THEN
                INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
                VALUES ('system', 'global', 'statistics_viewer', 'user', user_record.user_id::text)
                ON CONFLICT DO NOTHING;
            WHEN 'manage_system' THEN
                INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
                VALUES ('system', 'global', 'admin', 'user', user_record.user_id::text)
                ON CONFLICT DO NOTHING;
            WHEN 'manage_appraisals' THEN
                INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id)
                VALUES ('appraisal', '*', 'editor', 'user', user_record.user_id::text)
                ON CONFLICT DO NOTHING;
        END CASE;
    END LOOP;
    
    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW authz.expanded_permissions;
END $$;

-- Create helper functions for backward compatibility
CREATE OR REPLACE FUNCTION has_permission(p_user_id uuid, p_permission text)
RETURNS boolean AS $$
BEGIN
    -- Map old permission names to new authz checks
    CASE p_permission
        WHEN 'manage_users' THEN
            RETURN authz.check_permission('system', 'global', 'user_manager', 'user', p_user_id::text);
        WHEN 'manage_artworks' THEN
            RETURN authz.check_permission('artwork', '*', 'editor', 'user', p_user_id::text);
        WHEN 'manage_nfc_tags' THEN
            RETURN authz.check_permission('nfc_tag', '*', 'manager', 'user', p_user_id::text);
        WHEN 'view_statistics' THEN
            RETURN authz.check_permission('system', 'global', 'statistics_viewer', 'user', p_user_id::text);
        WHEN 'manage_system' THEN
            RETURN authz.check_permission('system', 'global', 'admin', 'user', p_user_id::text);
        WHEN 'manage_appraisals' THEN
            RETURN authz.check_permission('appraisal', '*', 'editor', 'user', p_user_id::text);
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for backward compatibility
CREATE OR REPLACE VIEW user_permissions_compat AS
SELECT DISTINCT
    subject_id::uuid as user_id,
    CASE 
        WHEN namespace = 'system' AND relation = 'user_manager' THEN 'manage_users'
        WHEN namespace = 'artwork' AND relation = 'editor' THEN 'manage_artworks'
        WHEN namespace = 'nfc_tag' AND relation = 'manager' THEN 'manage_nfc_tags'
        WHEN namespace = 'system' AND relation = 'statistics_viewer' THEN 'view_statistics'
        WHEN namespace = 'system' AND relation = 'admin' THEN 'manage_system'
        WHEN namespace = 'appraisal' AND relation = 'editor' THEN 'manage_appraisals'
    END as permission
FROM authz.expanded_permissions
WHERE subject_namespace = 'user'
AND (
    (namespace = 'system' AND relation IN ('user_manager', 'statistics_viewer', 'admin'))
    OR (namespace = 'artwork' AND object_id = '*' AND relation = 'editor')
    OR (namespace = 'nfc_tag' AND object_id = '*' AND relation = 'manager')
    OR (namespace = 'appraisal' AND object_id = '*' AND relation = 'editor')
);

-- Drop the migrate function as it's no longer needed
DROP FUNCTION IF EXISTS authz.migrate_user_role(uuid, text);