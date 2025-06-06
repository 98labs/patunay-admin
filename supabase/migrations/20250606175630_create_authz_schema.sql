-- Create Zanzibar-style RBAC system in authz schema
-- Based on Google Zanzibar's authorization model

-- Create dedicated authorization schema
CREATE SCHEMA IF NOT EXISTS authz;

-- Core relation tuples table (the heart of Zanzibar)
CREATE TABLE authz.tuples (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    namespace text NOT NULL,
    object_id text NOT NULL,
    relation text NOT NULL,
    subject_namespace text NOT NULL,
    subject_id text NOT NULL,
    subject_relation text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    
    -- Composite unique constraint to prevent duplicates
    UNIQUE(namespace, object_id, relation, subject_namespace, subject_id, subject_relation)
);

-- Index for efficient lookups
CREATE INDEX idx_authz_object_lookup ON authz.tuples(namespace, object_id, relation);
CREATE INDEX idx_authz_subject_lookup ON authz.tuples(subject_namespace, subject_id);
CREATE INDEX idx_authz_created_at ON authz.tuples(created_at);

-- Namespace configuration table
CREATE TABLE authz.namespaces (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    config jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Audit log for permission changes
CREATE TABLE authz.audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operation text NOT NULL, -- 'grant', 'revoke', 'check'
    tuple_data jsonb NOT NULL,
    result text,
    performed_by uuid REFERENCES auth.users(id),
    performed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_authz_audit_performed_at ON authz.audit_log(performed_at);
CREATE INDEX idx_authz_audit_performed_by ON authz.audit_log(performed_by);

-- Materialized view for performance optimization
CREATE MATERIALIZED VIEW authz.expanded_permissions AS
WITH RECURSIVE permission_expansion AS (
    -- Direct permissions
    SELECT 
        namespace,
        object_id,
        relation,
        subject_namespace,
        subject_id,
        subject_relation,
        0 as depth
    FROM authz.tuples
    
    UNION
    
    -- Transitive permissions through groups
    SELECT 
        p.namespace,
        p.object_id,
        p.relation,
        t.subject_namespace,
        t.subject_id,
        t.subject_relation,
        p.depth + 1
    FROM permission_expansion p
    JOIN authz.tuples t ON 
        p.subject_namespace = t.namespace AND
        p.subject_id = t.object_id AND
        (p.subject_relation = t.relation OR p.subject_relation IS NULL)
    WHERE p.depth < 10 -- Prevent infinite recursion
)
SELECT DISTINCT
    namespace,
    object_id,
    relation,
    subject_namespace,
    subject_id
FROM permission_expansion
WHERE subject_namespace = 'user';

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_authz_expanded_unique ON authz.expanded_permissions(namespace, object_id, relation, subject_namespace, subject_id);
CREATE INDEX idx_authz_expanded_lookup ON authz.expanded_permissions(namespace, object_id, relation);

-- Function to check permissions
CREATE OR REPLACE FUNCTION authz.check_permission(
    p_object_namespace text,
    p_object_id text,
    p_relation text,
    p_subject_namespace text,
    p_subject_id text
) RETURNS boolean AS $$
DECLARE
    v_result boolean;
BEGIN
    -- Check direct permission
    IF EXISTS (
        SELECT 1 FROM authz.tuples
        WHERE namespace = p_object_namespace
        AND object_id = p_object_id
        AND relation = p_relation
        AND subject_namespace = p_subject_namespace
        AND subject_id = p_subject_id
    ) THEN
        v_result := true;
    -- Check expanded permissions (through groups, inherited relations, etc.)
    ELSIF EXISTS (
        SELECT 1 FROM authz.expanded_permissions
        WHERE namespace = p_object_namespace
        AND object_id = p_object_id
        AND relation = p_relation
        AND subject_namespace = p_subject_namespace
        AND subject_id = p_subject_id
    ) THEN
        v_result := true;
    ELSE
        v_result := false;
    END IF;
    
    -- Log the check
    INSERT INTO authz.audit_log (operation, tuple_data, result, performed_by)
    VALUES (
        'check',
        jsonb_build_object(
            'namespace', p_object_namespace,
            'object_id', p_object_id,
            'relation', p_relation,
            'subject_namespace', p_subject_namespace,
            'subject_id', p_subject_id
        ),
        v_result::text,
        auth.uid()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant permission
CREATE OR REPLACE FUNCTION authz.grant_permission(
    p_object_namespace text,
    p_object_id text,
    p_relation text,
    p_subject_namespace text,
    p_subject_id text,
    p_subject_relation text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO authz.tuples (
        namespace, object_id, relation, 
        subject_namespace, subject_id, subject_relation,
        created_by
    ) VALUES (
        p_object_namespace, p_object_id, p_relation,
        p_subject_namespace, p_subject_id, p_subject_relation,
        auth.uid()
    )
    ON CONFLICT DO NOTHING;
    
    -- Log the operation
    INSERT INTO authz.audit_log (operation, tuple_data, performed_by)
    VALUES (
        'grant',
        jsonb_build_object(
            'namespace', p_object_namespace,
            'object_id', p_object_id,
            'relation', p_relation,
            'subject_namespace', p_subject_namespace,
            'subject_id', p_subject_id,
            'subject_relation', p_subject_relation
        ),
        auth.uid()
    );
    
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY authz.expanded_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke permission
CREATE OR REPLACE FUNCTION authz.revoke_permission(
    p_object_namespace text,
    p_object_id text,
    p_relation text,
    p_subject_namespace text,
    p_subject_id text,
    p_subject_relation text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    DELETE FROM authz.tuples
    WHERE namespace = p_object_namespace
    AND object_id = p_object_id
    AND relation = p_relation
    AND subject_namespace = p_subject_namespace
    AND subject_id = p_subject_id
    AND (subject_relation = p_subject_relation OR (subject_relation IS NULL AND p_subject_relation IS NULL));
    
    -- Log the operation
    INSERT INTO authz.audit_log (operation, tuple_data, performed_by)
    VALUES (
        'revoke',
        jsonb_build_object(
            'namespace', p_object_namespace,
            'object_id', p_object_id,
            'relation', p_relation,
            'subject_namespace', p_subject_namespace,
            'subject_id', p_subject_id,
            'subject_relation', p_subject_relation
        ),
        auth.uid()
    );
    
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY authz.expanded_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expand permissions (list all subjects with a given permission)
CREATE OR REPLACE FUNCTION authz.expand_permission(
    p_object_namespace text,
    p_object_id text,
    p_relation text
) RETURNS TABLE(subject_namespace text, subject_id text) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ep.subject_namespace, ep.subject_id
    FROM authz.expanded_permissions ep
    WHERE ep.namespace = p_object_namespace
    AND ep.object_id = p_object_id
    AND ep.relation = p_relation
    ORDER BY ep.subject_namespace, ep.subject_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list user permissions
CREATE OR REPLACE FUNCTION authz.list_user_permissions(
    p_user_id text
) RETURNS TABLE(namespace text, object_id text, relation text) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ep.namespace, ep.object_id, ep.relation
    FROM authz.expanded_permissions ep
    WHERE ep.subject_namespace = 'user'
    AND ep.subject_id = p_user_id
    ORDER BY ep.namespace, ep.object_id, ep.relation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE authz.tuples ENABLE ROW LEVEL SECURITY;
ALTER TABLE authz.namespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE authz.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify tuples
CREATE POLICY "Admins can view all tuples" ON authz.tuples
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM authz.tuples t
            WHERE t.namespace = 'system'
            AND t.object_id = 'global'
            AND t.relation = 'admin'
            AND t.subject_namespace = 'user'
            AND t.subject_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can insert tuples" ON authz.tuples
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM authz.tuples t
            WHERE t.namespace = 'system'
            AND t.object_id = 'global'
            AND t.relation = 'admin'
            AND t.subject_namespace = 'user'
            AND t.subject_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can delete tuples" ON authz.tuples
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM authz.tuples t
            WHERE t.namespace = 'system'
            AND t.object_id = 'global'
            AND t.relation = 'admin'
            AND t.subject_namespace = 'user'
            AND t.subject_id = auth.uid()::text
        )
    );

-- Admins can manage namespaces
CREATE POLICY "Admins can view namespaces" ON authz.namespaces
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM authz.tuples t
            WHERE t.namespace = 'system'
            AND t.object_id = 'global'
            AND t.relation = 'admin'
            AND t.subject_namespace = 'user'
            AND t.subject_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can manage namespaces" ON authz.namespaces
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM authz.tuples t
            WHERE t.namespace = 'system'
            AND t.object_id = 'global'
            AND t.relation = 'admin'
            AND t.subject_namespace = 'user'
            AND t.subject_id = auth.uid()::text
        )
    );

-- Everyone can view their own audit logs, admins can view all
CREATE POLICY "Users can view own audit logs" ON authz.audit_log
    FOR SELECT
    USING (
        performed_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM authz.tuples t
            WHERE t.namespace = 'system'
            AND t.object_id = 'global'
            AND t.relation = 'admin'
            AND t.subject_namespace = 'user'
            AND t.subject_id = auth.uid()::text
        )
    );

-- Insert default namespace configurations
INSERT INTO authz.namespaces (name, config) VALUES
('user', '{"relations": []}'::jsonb),
('group', '{"relations": {"member": {"usersets": ["this"]}}}'::jsonb),
('artwork', '{"relations": {"owner": {"usersets": ["this"]}, "editor": {"usersets": ["this", "owner"]}, "viewer": {"usersets": ["this", "editor", "group:staff#member"]}}}'::jsonb),
('nfc_tag', '{"relations": {"manager": {"usersets": ["this", "group:admins#member"]}}}'::jsonb),
('appraisal', '{"relations": {"appraiser": {"usersets": ["this"]}, "editor": {"usersets": ["this", "appraiser", "artwork#owner"]}, "viewer": {"usersets": ["this", "editor"]}}}'::jsonb),
('system', '{"relations": {"admin": {"usersets": ["this", "group:admins#member"]}, "user_manager": {"usersets": ["this", "admin"]}, "statistics_viewer": {"usersets": ["this", "group:staff#member", "admin"]}}}'::jsonb);

-- Create initial groups
INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id) VALUES
('group', 'admins', 'exist', 'group', 'admins'),
('group', 'staff', 'exist', 'group', 'staff');

-- Grant system admin permission to the admins group
INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id, subject_relation) VALUES
('system', 'global', 'admin', 'group', 'admins', 'member'),
('system', 'global', 'user_manager', 'group', 'admins', 'member'),
('system', 'global', 'statistics_viewer', 'group', 'staff', 'member');

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW authz.expanded_permissions;

-- Create a trigger to auto-refresh the materialized view (optional, for smaller datasets)
-- For larger datasets, you might want to refresh this periodically instead
CREATE OR REPLACE FUNCTION authz.refresh_expanded_permissions()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY authz.expanded_permissions;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Comment out for production if you prefer manual/scheduled refreshes
-- CREATE TRIGGER refresh_permissions_on_change
-- AFTER INSERT OR UPDATE OR DELETE ON authz.tuples
-- FOR EACH STATEMENT EXECUTE FUNCTION authz.refresh_expanded_permissions();