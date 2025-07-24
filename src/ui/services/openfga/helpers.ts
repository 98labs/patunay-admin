import { UserRole } from '../../typings/user';
import { OpenFGATuple } from './client';

/**
 * Convert user and organization IDs to OpenFGA format
 */
export function formatUser(userId: string): string {
  return `user:${userId}`;
}

export function formatOrganization(orgId: string): string {
  return `organization:${orgId}`;
}

export function formatArtwork(artworkId: string): string {
  return `artwork:${artworkId}`;
}

export function formatAppraisal(appraisalId: string): string {
  return `appraisal:${appraisalId}`;
}

export function formatNfcTag(tagId: string): string {
  return `nfc_tag:${tagId}`;
}

/**
 * Map traditional roles to OpenFGA relations
 */
export function roleToRelation(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    super_user: 'super_user',
    admin: 'admin',
    issuer: 'issuer',
    appraiser: 'appraiser',
    staff: 'staff',
    viewer: 'viewer',
  };
  return roleMap[role];
}

/**
 * Map permissions to OpenFGA relations
 */
export function permissionToRelation(permission: string): string {
  const permissionMap: Record<string, string> = {
    // Artwork permissions
    'view_artworks': 'can_view',
    'create_artwork': 'can_create',
    'update_artwork': 'can_update',
    'delete_artwork': 'can_delete',
    
    // Appraisal permissions
    'view_appraisals': 'can_view',
    'create_appraisal': 'can_create',
    'update_appraisal': 'can_update',
    'delete_appraisal': 'can_delete',
    
    // NFC permissions
    'view_nfc_tags': 'can_view',
    'attach_nfc_tag': 'can_attach',
    'detach_nfc_tag': 'can_detach',
    
    // User management permissions
    'manage_users': 'can_manage_users',
    'invite_users': 'can_invite_users',
    'remove_users': 'can_remove_users',
    'update_roles': 'can_update_roles',
    
    // Organization settings
    'view_organization': 'can_view',
    'update_organization': 'can_update',
  };
  
  return permissionMap[permission] || permission;
}

/**
 * Get resource type from permission
 */
export function getResourceType(permission: string): string {
  if (permission.includes('artwork')) return 'artwork';
  if (permission.includes('appraisal')) return 'appraisal';
  if (permission.includes('nfc')) return 'nfc_tag';
  if (permission.includes('user') || permission.includes('role')) return 'user_management';
  if (permission.includes('organization')) return 'organization_settings';
  return 'organization';
}

/**
 * Create tuples for assigning a user to an organization with a role
 */
export function createUserOrgTuples(userId: string, orgId: string, role: UserRole): OpenFGATuple[] {
  const user = formatUser(userId);
  const org = formatOrganization(orgId);
  const relation = roleToRelation(role);
  
  return [{
    user,
    relation,
    object: org,
  }];
}

/**
 * Create tuples for granting specific permissions
 */
export function createPermissionTuples(
  userId: string,
  orgId: string,
  resourceId: string,
  permission: string
): OpenFGATuple[] {
  const user = formatUser(userId);
  const relation = permissionToRelation(permission);
  const resourceType = getResourceType(permission);
  
  let object: string;
  switch (resourceType) {
    case 'artwork':
      object = formatArtwork(resourceId);
      break;
    case 'appraisal':
      object = formatAppraisal(resourceId);
      break;
    case 'nfc_tag':
      object = formatNfcTag(resourceId);
      break;
    case 'user_management':
      object = `user_management:${orgId}`;
      break;
    case 'organization_settings':
      object = `organization_settings:${orgId}`;
      break;
    default:
      object = formatOrganization(orgId);
  }
  
  return [{
    user,
    relation,
    object,
  }];
}

/**
 * Create tuples for resource relationships
 */
export function createResourceOrgTuples(
  resourceType: 'artwork' | 'appraisal' | 'nfc_tag',
  resourceId: string,
  orgId: string
): OpenFGATuple[] {
  const org = formatOrganization(orgId);
  let resource: string;
  
  switch (resourceType) {
    case 'artwork':
      resource = formatArtwork(resourceId);
      break;
    case 'appraisal':
      resource = formatAppraisal(resourceId);
      break;
    case 'nfc_tag':
      resource = formatNfcTag(resourceId);
      break;
  }
  
  return [{
    user: org,
    relation: 'organization',
    object: resource,
  }];
}

/**
 * Check if a permission is organization-scoped or global
 */
export function isGlobalPermission(permission: string): boolean {
  const globalPermissions = [
    'access_all_organizations',
    'manage_system',
  ];
  return globalPermissions.includes(permission);
}

/**
 * Format permission check for OpenFGA
 */
export function formatPermissionCheck(
  userId: string,
  permission: string,
  resourceId?: string,
  orgId?: string
): { user: string; relation: string; object: string } {
  const user = formatUser(userId);
  const relation = permissionToRelation(permission);
  
  if (isGlobalPermission(permission)) {
    return {
      user,
      relation,
      object: 'global_system:main',
    };
  }
  
  const resourceType = getResourceType(permission);
  let object: string;
  
  if (resourceId && resourceType !== 'organization') {
    // Specific resource check
    switch (resourceType) {
      case 'artwork':
        object = formatArtwork(resourceId);
        break;
      case 'appraisal':
        object = formatAppraisal(resourceId);
        break;
      case 'nfc_tag':
        object = formatNfcTag(resourceId);
        break;
      case 'user_management':
        object = `user_management:${orgId || resourceId}`;
        break;
      case 'organization_settings':
        object = `organization_settings:${orgId || resourceId}`;
        break;
      default:
        object = formatOrganization(orgId || resourceId);
    }
  } else if (orgId) {
    // Organization-level check
    if (resourceType === 'user_management') {
      object = `user_management:${orgId}`;
    } else if (resourceType === 'organization_settings') {
      object = `organization_settings:${orgId}`;
    } else {
      object = formatOrganization(orgId);
    }
  } else {
    throw new Error('Either resourceId or orgId must be provided for permission check');
  }
  
  return { user, relation, object };
}