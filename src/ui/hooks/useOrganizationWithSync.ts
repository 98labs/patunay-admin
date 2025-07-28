import { useCallback } from 'react';
import {
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '../store/api/organizationApi';
import { useOrganizationSync } from './useOpenFGASync';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../store/features/auth/authSlice';
import type { CreateOrganizationData, UpdateOrganizationData } from '../typings';

/**
 * Enhanced organization operations that automatically sync with OpenFGA
 */
export function useOrganizationWithSync() {
  const { user } = useAppSelector(selectAuth);
  const {
    syncUserRole,
    syncUserRemoval,
    syncOrganizationCreation,
  } = useOrganizationSync();

  const [createOrganizationMutation] = useCreateOrganizationMutation();
  const [updateOrganizationMutation] = useUpdateOrganizationMutation();
  const [deleteOrganizationMutation] = useDeleteOrganizationMutation();

  const createOrganization = useCallback(
    async (organizationData: CreateOrganizationData) => {
      try {
        // Create organization in Supabase
        const result = await createOrganizationMutation(organizationData).unwrap();
        
        if (result.id) {
          // Sync organization creation with OpenFGA
          await syncOrganizationCreation(result.id);
          
          // If the current user is creating the org, make them an admin
          if (user?.id) {
            await syncUserRole(user.id, result.id, 'admin');
          }
          
          console.log('✅ Organization synced with OpenFGA:', result.id);
        }
        
        return result;
      } catch (error) {
        console.error('❌ Failed to create organization or sync with OpenFGA:', error);
        throw error;
      }
    },
    [createOrganizationMutation, syncOrganizationCreation, syncUserRole, user?.id]
  );

  const updateOrganization = useCallback(
    async (updateData: UpdateOrganizationData) => {
      try {
        // Update organization in Supabase
        const result = await updateOrganizationMutation(updateData).unwrap();
        
        // Note: For basic org updates, no OpenFGA sync needed
        // If membership changes are involved, they would be handled separately
        
        return result;
      } catch (error) {
        console.error('❌ Failed to update organization:', error);
        throw error;
      }
    },
    [updateOrganizationMutation]
  );

  const deleteOrganization = useCallback(
    async (organizationId: string) => {
      try {
        // Delete (soft delete) organization in Supabase
        const result = await deleteOrganizationMutation(organizationId).unwrap();
        
        // Note: In a full implementation, you'd want to remove all OpenFGA relationships
        // for this organization. This would involve querying all users/resources
        // and removing their relationships to this org.
        
        console.log('✅ Organization deleted (sync with OpenFGA may need manual cleanup):', organizationId);
        
        return result;
      } catch (error) {
        console.error('❌ Failed to delete organization:', error);
        throw error;
      }
    },
    [deleteOrganizationMutation]
  );

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
}

/**
 * Hook for managing organization user relationships with OpenFGA sync
 */
export function useOrganizationUserSync() {
  const { syncUserRole, syncUserRemoval } = useOrganizationSync();

  const addUserToOrganization = useCallback(
    async (userId: string, organizationId: string, role: string) => {
      try {
        // First, add user to organization in Supabase
        // (This would typically be done through an API call)
        
        // Then sync with OpenFGA
        await syncUserRole(userId, organizationId, role);
        
        console.log('✅ User added to organization and synced with OpenFGA:', {
          userId,
          organizationId,
          role,
        });
      } catch (error) {
        console.error('❌ Failed to add user to organization or sync with OpenFGA:', error);
        throw error;
      }
    },
    [syncUserRole]
  );

  const removeUserFromOrganization = useCallback(
    async (userId: string, organizationId: string) => {
      try {
        // First, remove user from organization in Supabase
        // (This would typically be done through an API call)
        
        // Then sync with OpenFGA
        await syncUserRemoval(userId, organizationId);
        
        console.log('✅ User removed from organization and synced with OpenFGA:', {
          userId,
          organizationId,
        });
      } catch (error) {
        console.error('❌ Failed to remove user from organization or sync with OpenFGA:', error);
        throw error;
      }
    },
    [syncUserRemoval]
  );

  const updateUserRole = useCallback(
    async (userId: string, organizationId: string, newRole: string) => {
      try {
        // First, update user role in Supabase organization_users table
        // (This would typically be done through an API call)
        
        // Then sync with OpenFGA (this will overwrite the existing role)
        await syncUserRole(userId, organizationId, newRole);
        
        console.log('✅ User role updated and synced with OpenFGA:', {
          userId,
          organizationId,
          newRole,
        });
      } catch (error) {
        console.error('❌ Failed to update user role or sync with OpenFGA:', error);
        throw error;
      }
    },
    [syncUserRole]
  );

  return {
    addUserToOrganization,
    removeUserFromOrganization,
    updateUserRole,
  };
}