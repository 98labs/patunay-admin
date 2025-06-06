/**
 * Authorization service exports
 */

export { authzService } from './authzService';
export type {
  AuthzTuple,
  Namespace,
  NamespaceRelations,
  PermissionCheckResult,
  AuthzSubject,
  AuthzObject,
  AuthzAuditLog,
  NamespaceConfig,
  LegacyPermission
} from './types';
export { LEGACY_PERMISSION_MAP } from './types';