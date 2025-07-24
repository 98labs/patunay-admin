import { openFGA } from './client';
import { 
  createUserOrgTuples, 
  createResourceOrgTuples,
  formatUser,
  formatOrganization,
  roleToRelation,
} from './helpers';
import { UserRole } from '../../typings/user';

export class OpenFGASyncService {
  /**
   * Sync user role assignment to OpenFGA
   */
  async syncUserRole(userId: string, orgId: string, role: UserRole): Promise<void> {
    try {
      // Remove all existing roles for this user in this org
      const existingRoles: UserRole[] = ['admin', 'staff', 'viewer', 'issuer', 'appraiser'];
      const deleteTuples = existingRoles.map(r => ({
        user: formatUser(userId),
        relation: roleToRelation(r),
        object: formatOrganization(orgId),
      }));

      // Add the new role
      const addTuples = createUserOrgTuples(userId, orgId, role);

      // Perform the update
      await openFGA.delete(deleteTuples);
      await openFGA.write(addTuples);

      console.log(`Synced role ${role} for user ${userId} in org ${orgId}`);
    } catch (error) {
      console.error('Failed to sync user role:', error);
      throw error;
    }
  }

  /**
   * Sync user removal from organization
   */
  async syncUserRemoval(userId: string, orgId: string): Promise<void> {
    try {
      const roles: UserRole[] = ['admin', 'staff', 'viewer', 'issuer', 'appraiser'];
      const deleteTuples = roles.map(r => ({
        user: formatUser(userId),
        relation: roleToRelation(r),
        object: formatOrganization(orgId),
      }));

      await openFGA.delete(deleteTuples);
      console.log(`Removed user ${userId} from org ${orgId}`);
    } catch (error) {
      console.error('Failed to sync user removal:', error);
      throw error;
    }
  }

  /**
   * Sync resource creation (artwork, appraisal, nfc_tag)
   */
  async syncResourceCreation(
    resourceType: 'artwork' | 'appraisal' | 'nfc_tag',
    resourceId: string,
    orgId: string,
    creatorId?: string
  ): Promise<void> {
    try {
      const tuples = createResourceOrgTuples(resourceType, resourceId, orgId);

      // For appraisals, also add creator relationship
      if (resourceType === 'appraisal' && creatorId) {
        tuples.push({
          user: formatUser(creatorId),
          relation: 'creator',
          object: `appraisal:${resourceId}`,
        });
      }

      await openFGA.write(tuples);
      console.log(`Synced ${resourceType} ${resourceId} to org ${orgId}`);
    } catch (error) {
      console.error('Failed to sync resource creation:', error);
      throw error;
    }
  }

  /**
   * Sync resource deletion
   */
  async syncResourceDeletion(
    resourceType: 'artwork' | 'appraisal' | 'nfc_tag',
    resourceId: string
  ): Promise<void> {
    try {
      // List all users who have any relation to this resource
      const relations = ['can_view', 'can_create', 'can_update', 'can_delete', 'creator'];
      const object = `${resourceType}:${resourceId}`;

      for (const relation of relations) {
        const { users } = await openFGA.listUsers(object, relation);
        if (users.length > 0) {
          const deleteTuples = users.map(user => ({
            user,
            relation,
            object,
          }));
          await openFGA.delete(deleteTuples);
        }
      }

      console.log(`Deleted all relations for ${resourceType} ${resourceId}`);
    } catch (error) {
      console.error('Failed to sync resource deletion:', error);
      throw error;
    }
  }

  /**
   * Sync super user assignment
   */
  async syncSuperUser(userId: string, isSuperUser: boolean): Promise<void> {
    try {
      const tuple = {
        user: formatUser(userId),
        relation: 'super_user',
        object: 'global_system:main',
      };

      if (isSuperUser) {
        await openFGA.write([tuple]);
      } else {
        await openFGA.delete([tuple]);
      }

      console.log(`Synced super user status for ${userId}: ${isSuperUser}`);
    } catch (error) {
      console.error('Failed to sync super user:', error);
      throw error;
    }
  }

  /**
   * Sync organization settings access
   */
  async syncOrganizationAccess(orgId: string): Promise<void> {
    try {
      const tuples = [
        {
          user: formatOrganization(orgId),
          relation: 'organization',
          object: `user_management:${orgId}`,
        },
        {
          user: formatOrganization(orgId),
          relation: 'organization',
          object: `organization_settings:${orgId}`,
        },
      ];

      await openFGA.write(tuples);
      console.log(`Synced organization access for ${orgId}`);
    } catch (error) {
      console.error('Failed to sync organization access:', error);
      throw error;
    }
  }

  /**
   * Bulk sync all users in an organization
   */
  async bulkSyncOrgUsers(
    orgId: string,
    users: Array<{ userId: string; role: UserRole }>
  ): Promise<void> {
    try {
      const tuples = users.flatMap(({ userId, role }) =>
        createUserOrgTuples(userId, orgId, role)
      );

      await openFGA.write(tuples);
      console.log(`Bulk synced ${users.length} users to org ${orgId}`);
    } catch (error) {
      console.error('Failed to bulk sync users:', error);
      throw error;
    }
  }

  /**
   * Sync resource ownership transfer
   */
  async syncResourceTransfer(
    resourceType: 'artwork' | 'appraisal' | 'nfc_tag',
    resourceId: string,
    fromOrgId: string,
    toOrgId: string
  ): Promise<void> {
    try {
      const object = `${resourceType}:${resourceId}`;

      // Remove old organization relationship
      await openFGA.delete([{
        user: formatOrganization(fromOrgId),
        relation: 'organization',
        object,
      }]);

      // Add new organization relationship
      await openFGA.write([{
        user: formatOrganization(toOrgId),
        relation: 'organization',
        object,
      }]);

      console.log(`Transferred ${resourceType} ${resourceId} from ${fromOrgId} to ${toOrgId}`);
    } catch (error) {
      console.error('Failed to sync resource transfer:', error);
      throw error;
    }
  }
}

export const openFGASync = new OpenFGASyncService();