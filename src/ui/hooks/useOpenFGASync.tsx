import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../store/features/auth/authSlice';
import { openFGASync } from '../services/openfga/sync';

/**
 * Hook to automatically sync user permissions with OpenFGA
 */
export function useOpenFGASync() {
  const { user, isAuthenticated } = useAppSelector(selectAuth);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const syncUserPermissions = async () => {
      try {
        // Sync super user status
        if (user.role === 'super_user') {
          await openFGASync.syncSuperUser(user.id, true);
        }

        // Sync organization memberships
        if (user.organizations && user.organizations.length > 0) {
          for (const org of user.organizations) {
            if (org.role) {
              await openFGASync.syncUserRole(user.id, org.id, org.role);
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync user permissions:', error);
      }
    };

    syncUserPermissions();
  }, [user, isAuthenticated]);
}

/**
 * Hook to sync resource changes with OpenFGA
 */
export function useResourceSync() {
  const syncArtworkCreation = async (artworkId: string, orgId: string) => {
    try {
      await openFGASync.syncResourceCreation('artwork', artworkId, orgId);
    } catch (error) {
      console.error('Failed to sync artwork creation:', error);
    }
  };

  const syncAppraisalCreation = async (
    appraisalId: string,
    orgId: string,
    creatorId: string
  ) => {
    try {
      await openFGASync.syncResourceCreation('appraisal', appraisalId, orgId, creatorId);
    } catch (error) {
      console.error('Failed to sync appraisal creation:', error);
    }
  };

  const syncNfcTagCreation = async (tagId: string, orgId: string) => {
    try {
      await openFGASync.syncResourceCreation('nfc_tag', tagId, orgId);
    } catch (error) {
      console.error('Failed to sync NFC tag creation:', error);
    }
  };

  const syncResourceDeletion = async (
    resourceType: 'artwork' | 'appraisal' | 'nfc_tag',
    resourceId: string
  ) => {
    try {
      await openFGASync.syncResourceDeletion(resourceType, resourceId);
    } catch (error) {
      console.error('Failed to sync resource deletion:', error);
    }
  };

  return {
    syncArtworkCreation,
    syncAppraisalCreation,
    syncNfcTagCreation,
    syncResourceDeletion,
  };
}

/**
 * Hook to sync organization changes with OpenFGA
 */
export function useOrganizationSync() {
  const syncUserRole = async (userId: string, orgId: string, role: string) => {
    try {
      await openFGASync.syncUserRole(userId, orgId, role as any);
    } catch (error) {
      console.error('Failed to sync user role:', error);
    }
  };

  const syncUserRemoval = async (userId: string, orgId: string) => {
    try {
      await openFGASync.syncUserRemoval(userId, orgId);
    } catch (error) {
      console.error('Failed to sync user removal:', error);
    }
  };

  const syncOrganizationCreation = async (orgId: string) => {
    try {
      await openFGASync.syncOrganizationAccess(orgId);
    } catch (error) {
      console.error('Failed to sync organization creation:', error);
    }
  };

  return {
    syncUserRole,
    syncUserRemoval,
    syncOrganizationCreation,
  };
}