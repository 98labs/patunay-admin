/**
 * Types for the Zanzibar-style authorization system
 */

/**
 * Represents a namespace in the authz system
 */
export type Namespace = 'user' | 'group' | 'artwork' | 'nfc_tag' | 'appraisal' | 'system';

/**
 * Relations available for each namespace
 */
export interface NamespaceRelations {
  user: never;
  group: 'member' | 'exist';
  artwork: 'owner' | 'editor' | 'viewer';
  nfc_tag: 'manager';
  appraisal: 'appraiser' | 'editor' | 'viewer';
  system: 'admin' | 'user_manager' | 'statistics_viewer';
}

/**
 * A relation tuple in the authz system
 */
export interface AuthzTuple {
  namespace: Namespace;
  objectId: string;
  relation: string;
  subjectNamespace: Namespace;
  subjectId: string;
  subjectRelation?: string;
}

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  allowed: boolean;
  tuple?: AuthzTuple;
}

/**
 * Subject in the authz system
 */
export interface AuthzSubject {
  namespace: Namespace;
  id: string;
  relation?: string;
}

/**
 * Object in the authz system
 */
export interface AuthzObject {
  namespace: Namespace;
  id: string;
}

/**
 * Audit log entry
 */
export interface AuthzAuditLog {
  id: string;
  operation: 'grant' | 'revoke' | 'check';
  tupleData: AuthzTuple;
  result?: string;
  performedBy?: string;
  performedAt: Date;
}

/**
 * Namespace configuration
 */
export interface NamespaceConfig {
  name: Namespace;
  relations: Record<string, {
    usersets: string[];
  }>;
}

/**
 * Common permission mappings for backward compatibility
 */
export type LegacyPermission = 
  | 'manage_users'
  | 'manage_artworks'
  | 'manage_nfc_tags'
  | 'view_statistics'
  | 'manage_system'
  | 'manage_appraisals';

/**
 * Map legacy permissions to authz tuples
 */
export const LEGACY_PERMISSION_MAP: Record<LegacyPermission, Pick<AuthzTuple, 'namespace' | 'objectId' | 'relation'>> = {
  'manage_users': { namespace: 'system', objectId: 'global', relation: 'user_manager' },
  'manage_artworks': { namespace: 'artwork', objectId: '*', relation: 'editor' },
  'manage_nfc_tags': { namespace: 'nfc_tag', objectId: '*', relation: 'manager' },
  'view_statistics': { namespace: 'system', objectId: 'global', relation: 'statistics_viewer' },
  'manage_system': { namespace: 'system', objectId: 'global', relation: 'admin' },
  'manage_appraisals': { namespace: 'appraisal', objectId: '*', relation: 'editor' },
};