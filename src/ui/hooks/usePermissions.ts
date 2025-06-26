import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '../typings';

export interface PermissionCapabilities {
  // Organization management
  canManageOrganizations: boolean;
  canManageOrgUsers: boolean;
  canManageOrgSettings: boolean;
  
  // User management
  canManageAllUsers: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  
  // Artwork management
  canManageAllArtworks: boolean;
  canManageOrgArtworks: boolean;
  canCreateArtworks: boolean;
  canViewArtworks: boolean;
  canDeleteArtworks: boolean;
  
  // NFC tag management
  canManageAllNfcTags: boolean;
  canManageOrgNfcTags: boolean;
  canAttachNfcTags: boolean;
  canIssueNfcTags: boolean;
  
  // Appraisal management
  canManageAllAppraisals: boolean;
  canManageOrgAppraisals: boolean;
  canCreateAppraisals: boolean;
  canUpdateAppraisals: boolean;
  canViewAppraisalDetails: boolean;
  
  // Statistics and reporting
  canViewAllStatistics: boolean;
  canViewOrgStatistics: boolean;
  canViewPublicStatistics: boolean;
  
  // System management
  canManageSystem: boolean;
  canGrantCrossOrgPermissions: boolean;
  
  // Cross-organizational capabilities
  canWorkAcrossOrganizations: boolean;
  canAccessMultipleOrgs: boolean;
}

export const usePermissions = (organizationId?: string) => {
  const { 
    user, 
    hasRole, 
    hasPermission, 
    canPerform, 
    currentOrganization,
    isSuperUser,
    isAdmin,
    isIssuer,
    isAppraiser,
    isStaff,
    isViewer
  } = useAuth();

  const targetOrgId = organizationId || currentOrganization?.id;

  const capabilities: PermissionCapabilities = useMemo(() => {
    if (!user) {
      return {
        canManageOrganizations: false,
        canManageOrgUsers: false,
        canManageOrgSettings: false,
        canManageAllUsers: false,
        canViewUsers: false,
        canCreateUsers: false,
        canDeleteUsers: false,
        canManageAllArtworks: false,
        canManageOrgArtworks: false,
        canCreateArtworks: false,
        canViewArtworks: false,
        canDeleteArtworks: false,
        canManageAllNfcTags: false,
        canManageOrgNfcTags: false,
        canAttachNfcTags: false,
        canIssueNfcTags: false,
        canManageAllAppraisals: false,
        canManageOrgAppraisals: false,
        canCreateAppraisals: false,
        canUpdateAppraisals: false,
        canViewAppraisalDetails: false,
        canViewAllStatistics: false,
        canViewOrgStatistics: false,
        canViewPublicStatistics: false,
        canManageSystem: false,
        canGrantCrossOrgPermissions: false,
        canWorkAcrossOrganizations: false,
        canAccessMultipleOrgs: false,
      };
    }

    return {
      // Organization management
      canManageOrganizations: hasPermission('manage_organizations'),
      canManageOrgUsers: hasPermission('manage_org_users', targetOrgId) || hasPermission('manage_all_users'),
      canManageOrgSettings: hasPermission('manage_org_settings', targetOrgId),
      
      // User management
      canManageAllUsers: hasPermission('manage_all_users'),
      canViewUsers: hasPermission('manage_org_users', targetOrgId) || hasPermission('manage_all_users'),
      canCreateUsers: hasPermission('manage_org_users', targetOrgId) || hasPermission('manage_all_users'),
      canDeleteUsers: hasPermission('manage_org_users', targetOrgId) || hasPermission('manage_all_users'),
      
      // Artwork management
      canManageAllArtworks: hasPermission('manage_all_artworks'),
      canManageOrgArtworks: hasPermission('manage_org_artworks', targetOrgId) || hasPermission('manage_artworks', targetOrgId) || hasPermission('manage_all_artworks'),
      canCreateArtworks: hasPermission('create_artworks', targetOrgId) || hasPermission('manage_artworks', targetOrgId) || hasPermission('manage_org_artworks', targetOrgId) || hasPermission('manage_all_artworks'),
      canViewArtworks: hasPermission('view_artworks', targetOrgId) || hasPermission('view_own_artworks', targetOrgId) || hasPermission('manage_all_artworks'),
      canDeleteArtworks: hasPermission('manage_org_artworks', targetOrgId) || hasPermission('manage_all_artworks'),
      
      // NFC tag management
      canManageAllNfcTags: hasPermission('manage_all_nfc_tags'),
      canManageOrgNfcTags: hasPermission('manage_org_nfc_tags', targetOrgId) || hasPermission('manage_nfc_tags', targetOrgId) || hasPermission('manage_all_nfc_tags'),
      canAttachNfcTags: hasPermission('attach_nfc_tags', targetOrgId) || hasPermission('manage_all_nfc_tags'),
      canIssueNfcTags: hasPermission('manage_nfc_tags', targetOrgId) || hasPermission('manage_org_nfc_tags', targetOrgId) || hasPermission('manage_all_nfc_tags'),
      
      // Appraisal management
      canManageAllAppraisals: hasPermission('manage_all_appraisals'),
      canManageOrgAppraisals: hasPermission('manage_org_appraisals', targetOrgId) || hasPermission('manage_appraisals', targetOrgId),
      canCreateAppraisals: hasPermission('create_appraisals', targetOrgId) || hasPermission('manage_appraisals', targetOrgId),
      canUpdateAppraisals: hasPermission('update_appraisals', targetOrgId) || hasPermission('manage_appraisals', targetOrgId),
      canViewAppraisalDetails: hasPermission('view_artwork_details', targetOrgId) || hasPermission('manage_appraisals', targetOrgId),
      
      // Statistics and reporting
      canViewAllStatistics: hasPermission('view_all_statistics'),
      canViewOrgStatistics: hasPermission('view_org_statistics', targetOrgId) || hasPermission('view_statistics', targetOrgId),
      canViewPublicStatistics: hasPermission('view_public_statistics', targetOrgId),
      
      // System management
      canManageSystem: hasPermission('manage_system'),
      canGrantCrossOrgPermissions: hasPermission('grant_cross_org_permissions', targetOrgId),
      
      // Cross-organizational capabilities
      canWorkAcrossOrganizations: isIssuer || isAppraiser || isSuperUser,
      canAccessMultipleOrgs: isSuperUser || isIssuer || isAppraiser,
    };
  }, [user, targetOrgId, hasPermission, isIssuer, isAppraiser, isSuperUser]);

  // Helper functions for common permission checks
  const canAccessRoute = (requiredPermission: string, orgId?: string): boolean => {
    return hasPermission(requiredPermission, orgId || targetOrgId);
  };

  const canAccessComponent = (requiredRole: UserRole, orgId?: string): boolean => {
    return hasRole(requiredRole, orgId || targetOrgId);
  };

  const canModifyResource = (resourceOrgId: string, requiredPermission: string): boolean => {
    // Super users can modify anything
    if (isSuperUser) return true;
    
    // Check if user has permission in the resource's organization
    return hasPermission(requiredPermission, resourceOrgId);
  };

  const getAvailableActions = (resourceType: 'artwork' | 'user' | 'nfc_tag' | 'appraisal', orgId?: string): string[] => {
    const actions: string[] = [];
    const checkOrgId = orgId || targetOrgId;

    switch (resourceType) {
      case 'artwork':
        if (capabilities.canViewArtworks) actions.push('view');
        if (capabilities.canCreateArtworks) actions.push('create');
        if (capabilities.canManageOrgArtworks || capabilities.canManageAllArtworks) actions.push('edit', 'delete');
        break;
        
      case 'user':
        if (capabilities.canViewUsers) actions.push('view');
        if (capabilities.canCreateUsers) actions.push('create');
        if (capabilities.canManageOrgUsers || capabilities.canManageAllUsers) actions.push('edit', 'delete');
        break;
        
      case 'nfc_tag':
        if (capabilities.canManageOrgNfcTags || capabilities.canManageAllNfcTags) actions.push('view', 'create', 'edit', 'delete');
        if (capabilities.canAttachNfcTags) actions.push('attach');
        break;
        
      case 'appraisal':
        if (capabilities.canViewAppraisalDetails) actions.push('view');
        if (capabilities.canCreateAppraisals) actions.push('create');
        if (capabilities.canUpdateAppraisals) actions.push('edit');
        if (capabilities.canManageOrgAppraisals || capabilities.canManageAllAppraisals) actions.push('delete');
        break;
    }

    return actions;
  };

  return {
    ...capabilities,
    canAccessRoute,
    canAccessComponent,
    canModifyResource,
    getAvailableActions,
    hasRole: (role: UserRole, orgId?: string) => hasRole(role, orgId || targetOrgId),
    hasPermission: (permission: string, orgId?: string) => hasPermission(permission, orgId || targetOrgId),
    canPerform: (action: string, orgId?: string) => canPerform(action, orgId || targetOrgId),
  };
};