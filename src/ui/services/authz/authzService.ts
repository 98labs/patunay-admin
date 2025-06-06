/**
 * Zanzibar-style authorization service
 */

import { supabase } from '../../supabase';
import type { 
  AuthzTuple, 
  Namespace, 
  PermissionCheckResult,
  AuthzSubject,
  AuthzObject,
  LegacyPermission,
  LEGACY_PERMISSION_MAP
} from './types';

export { LEGACY_PERMISSION_MAP } from './types';

class AuthzService {
  /**
   * Check if a subject has a specific permission on an object
   */
  async check(
    namespace: Namespace,
    objectId: string,
    relation: string,
    subjectNamespace: Namespace,
    subjectId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_permission', {
        p_object_namespace: namespace,
        p_object_id: objectId,
        p_relation: relation,
        p_subject_namespace: subjectNamespace,
        p_subject_id: subjectId
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if the current user has a specific permission
   */
  async checkCurrentUser(
    namespace: Namespace,
    objectId: string,
    relation: string
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    return this.check(namespace, objectId, relation, 'user', user.id);
  }

  /**
   * Grant a permission
   */
  async grant(
    namespace: Namespace,
    objectId: string,
    relation: string,
    subjectNamespace: Namespace,
    subjectId: string,
    subjectRelation?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('grant_permission', {
      p_object_namespace: namespace,
      p_object_id: objectId,
      p_relation: relation,
      p_subject_namespace: subjectNamespace,
      p_subject_id: subjectId,
      p_subject_relation: subjectRelation || null
    });

    if (error) {
      throw new Error(`Failed to grant permission: ${error.message}`);
    }
  }

  /**
   * Revoke a permission
   */
  async revoke(
    namespace: Namespace,
    objectId: string,
    relation: string,
    subjectNamespace: Namespace,
    subjectId: string,
    subjectRelation?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('revoke_permission', {
      p_object_namespace: namespace,
      p_object_id: objectId,
      p_relation: relation,
      p_subject_namespace: subjectNamespace,
      p_subject_id: subjectId,
      p_subject_relation: subjectRelation || null
    });

    if (error) {
      throw new Error(`Failed to revoke permission: ${error.message}`);
    }
  }

  /**
   * Expand a permission to get all subjects that have it
   */
  async expand(
    namespace: Namespace,
    objectId: string,
    relation: string
  ): Promise<AuthzSubject[]> {
    const { data, error } = await supabase.rpc('expand_permission', {
      p_object_namespace: namespace,
      p_object_id: objectId,
      p_relation: relation
    });

    if (error) {
      throw new Error(`Failed to expand permission: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      namespace: row.subject_namespace,
      id: row.subject_id
    }));
  }

  /**
   * List all permissions for a user
   */
  async listUserPermissions(userId: string): Promise<AuthzObject[]> {
    const { data, error } = await supabase.rpc('list_user_permissions', {
      p_user_id: userId
    });

    if (error) {
      throw new Error(`Failed to list user permissions: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      namespace: row.namespace,
      id: row.object_id,
      relation: row.relation
    }));
  }

  /**
   * List all permissions for the current user
   */
  async listCurrentUserPermissions(): Promise<AuthzObject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    return this.listUserPermissions(user.id);
  }

  /**
   * Add a user to a group
   */
  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    return this.grant('group', groupId, 'member', 'user', userId);
  }

  /**
   * Remove a user from a group
   */
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    return this.revoke('group', groupId, 'member', 'user', userId);
  }

  /**
   * Check if a user is in a group
   */
  async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    return this.check('group', groupId, 'member', 'user', userId);
  }

  /**
   * Get all members of a group
   */
  async getGroupMembers(groupId: string): Promise<string[]> {
    const subjects = await this.expand('group', groupId, 'member');
    return subjects
      .filter(s => s.namespace === 'user')
      .map(s => s.id);
  }

  /**
   * Check legacy permission (for backward compatibility)
   */
  async checkLegacyPermission(userId: string, permission: LegacyPermission): Promise<boolean> {
    const mapping = LEGACY_PERMISSION_MAP[permission];
    if (!mapping) {
      return false;
    }

    return this.check(
      mapping.namespace,
      mapping.objectId,
      mapping.relation,
      'user',
      userId
    );
  }

  /**
   * Grant legacy permission (for backward compatibility)
   */
  async grantLegacyPermission(userId: string, permission: LegacyPermission): Promise<void> {
    const mapping = LEGACY_PERMISSION_MAP[permission];
    if (!mapping) {
      throw new Error(`Unknown legacy permission: ${permission}`);
    }

    return this.grant(
      mapping.namespace,
      mapping.objectId,
      mapping.relation,
      'user',
      userId
    );
  }

  /**
   * Revoke legacy permission (for backward compatibility)
   */
  async revokeLegacyPermission(userId: string, permission: LegacyPermission): Promise<void> {
    const mapping = LEGACY_PERMISSION_MAP[permission];
    if (!mapping) {
      throw new Error(`Unknown legacy permission: ${permission}`);
    }

    return this.revoke(
      mapping.namespace,
      mapping.objectId,
      mapping.relation,
      'user',
      userId
    );
  }

  /**
   * Batch check multiple permissions
   */
  async batchCheck(
    checks: Array<{
      namespace: Namespace;
      objectId: string;
      relation: string;
      subjectNamespace: Namespace;
      subjectId: string;
    }>
  ): Promise<boolean[]> {
    const results = await Promise.all(
      checks.map(check => 
        this.check(
          check.namespace,
          check.objectId,
          check.relation,
          check.subjectNamespace,
          check.subjectId
        )
      )
    );

    return results;
  }

  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    return this.checkCurrentUser('system', 'global', 'admin');
  }

  /**
   * Check if a user is admin
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    return this.check('system', 'global', 'admin', 'user', userId);
  }
}

// Export singleton instance
export const authzService = new AuthzService();