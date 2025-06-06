# Zanzibar-Style RBAC System Design for Patunay Admin

## Overview

This document outlines the design of a Google Zanzibar-inspired RBAC (Role-Based Access Control) system for the Patunay Admin application. Zanzibar is Google's global authorization system that provides a unified data model and configuration language for expressing a wide range of access control policies.

## Core Concepts

### 1. Relation Tuples
The fundamental unit in Zanzibar is a relation tuple, which represents a relationship between:
- **Object**: A resource being accessed (e.g., `artwork:123`, `user:456`, `system:settings`)
- **Relation**: The type of relationship (e.g., `owner`, `editor`, `viewer`, `member`)
- **Subject**: The entity that has the relationship (e.g., `user:789`, `group:admins`)

Format: `<object>#<relation>@<subject>`

Examples:
- `artwork:123#owner@user:456` - User 456 owns artwork 123
- `group:admins#member@user:789` - User 789 is a member of the admins group
- `artwork:123#viewer@group:staff` - Staff group can view artwork 123

### 2. Namespace Configuration
Define the structure of objects and their possible relations:

```yaml
namespaces:
  user:
    relations: []
    
  group:
    relations:
      member:
        usersets:
          - this
          
  artwork:
    relations:
      owner:
        usersets:
          - this
      editor:
        usersets:
          - this
          - owner
      viewer:
        usersets:
          - this
          - editor
          - group:staff#member
          
  nfc_tag:
    relations:
      manager:
        usersets:
          - this
          - group:admins#member
          
  appraisal:
    relations:
      appraiser:
        usersets:
          - this
      editor:
        usersets:
          - this
          - appraiser
          - artwork#owner
      viewer:
        usersets:
          - this
          - editor
          
  system:
    relations:
      admin:
        usersets:
          - this
          - group:admins#member
      user_manager:
        usersets:
          - this
          - admin
      statistics_viewer:
        usersets:
          - this
          - group:staff#member
          - admin
```

### 3. Permission Checks
Permission checks are performed using the "check" API:
- Input: `<object>#<relation>@<subject>`
- Output: `allowed` or `denied`

Example checks:
- Can user 123 edit artwork 456? Check: `artwork:456#editor@user:123`
- Can user 789 manage users? Check: `system:global#user_manager@user:789`

### 4. Expansion
The system can expand a relation to show all subjects that have access:
- Input: `artwork:123#viewer`
- Output: All users and groups that can view artwork 123

## Database Schema

```sql
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

-- Function to check permissions
CREATE OR REPLACE FUNCTION authz.check_permission(
    p_object_namespace text,
    p_object_id text,
    p_relation text,
    p_subject_namespace text,
    p_subject_id text
) RETURNS boolean AS $$
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
        RETURN true;
    END IF;
    
    -- Check expanded permissions (through groups, inherited relations, etc.)
    IF EXISTS (
        SELECT 1 FROM authz.expanded_permissions
        WHERE namespace = p_object_namespace
        AND object_id = p_object_id
        AND relation = p_relation
        AND subject_namespace = p_subject_namespace
        AND subject_id = p_subject_id
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
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
```

## Migration Strategy

### Phase 1: Parallel Implementation
1. Implement Zanzibar tables and functions alongside existing RBAC
2. Mirror existing permissions in Zanzibar format:
   - Admin role → `group:admins#member@user:X`
   - Staff role → `group:staff#member@user:X`
   - Individual permissions → Direct tuples

### Phase 2: Gradual Migration
1. Update permission checks to use Zanzibar
2. Maintain backward compatibility with existing system
3. Add new features using only Zanzibar

### Phase 3: Full Migration
1. Remove old permission tables
2. Update all code to use Zanzibar exclusively

## Implementation Examples

### 1. Creating Initial Groups and Permissions
```sql
-- Create admin and staff groups
INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id) VALUES
('group', 'admins', 'member', 'user', 'admin-user-id'),
('group', 'staff', 'member', 'user', 'staff-user-id');

-- Grant system permissions to groups
INSERT INTO authz.tuples (namespace, object_id, relation, subject_namespace, subject_id, subject_relation) VALUES
('system', 'global', 'admin', 'group', 'admins', 'member'),
('system', 'global', 'statistics_viewer', 'group', 'staff', 'member');
```

### 2. Checking Permissions in TypeScript
```typescript
interface ZanzibarService {
  check(namespace: string, objectId: string, relation: string, subjectNamespace: string, subjectId: string): Promise<boolean>;
  grant(namespace: string, objectId: string, relation: string, subjectNamespace: string, subjectId: string, subjectRelation?: string): Promise<void>;
  revoke(namespace: string, objectId: string, relation: string, subjectNamespace: string, subjectId: string, subjectRelation?: string): Promise<void>;
  expand(namespace: string, objectId: string, relation: string): Promise<Subject[]>;
}

// Example usage
const canEditArtwork = await zanzibar.check('artwork', '123', 'editor', 'user', currentUser.id);
const canManageUsers = await zanzibar.check('system', 'global', 'user_manager', 'user', currentUser.id);
```

### 3. React Hook for Permissions
```typescript
export function useZanzibarPermission(namespace: string, objectId: string, relation: string) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    zanzibar.check(namespace, objectId, relation, 'user', user.id)
      .then(setHasPermission)
      .finally(() => setIsLoading(false));
  }, [namespace, objectId, relation, user]);

  return { hasPermission, isLoading };
}
```

## Advantages of Zanzibar-Style RBAC

1. **Flexibility**: Can represent any access control pattern (RBAC, ABAC, ownership, etc.)
2. **Consistency**: Single model for all permissions across the system
3. **Performance**: Materialized views and indexes for fast permission checks
4. **Auditability**: Complete audit trail of all permission changes
5. **Scalability**: Proven to work at Google scale
6. **Fine-grained**: Can control access to individual resources
7. **Inheritance**: Natural support for permission inheritance through relations

## Next Steps

1. Create database migrations for Zanzibar tables
2. Implement core Zanzibar service in TypeScript
3. Create React hooks and components for permission management
4. Build UI for managing permissions
5. Migrate existing permissions to Zanzibar format
6. Update all permission checks to use Zanzibar