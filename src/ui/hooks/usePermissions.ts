import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '../typings';

export interface PermissionCapabilities {
  // User management
  canManageAllUsers: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  
  // Artwork management
  canManageAllArtworks: boolean;
  canCreateArtworks: boolean;
  canViewArtworks: boolean;
  canDeleteArtworks: boolean;
  
  // NFC tag management
  canManageAllNfcTags: boolean;
  canAttachNfcTags: boolean;
  canIssueNfcTags: boolean;
  
  // Appraisal management
  canManageAllAppraisals: boolean;
  canCreateAppraisals: boolean;
  canUpdateAppraisals: boolean;
  canViewAppraisalDetails: boolean;
  
  // Statistics and reporting
  canViewAllStatistics: boolean;
  canViewPublicStatistics: boolean;
  
  // System management
  canManageSystem: boolean;
  canExportData: boolean;
}

export const usePermissions = () => {
  const { 
    user, 
    hasRole, 
    hasPermission, 
    canPerform,
    isAdmin,
    isIssuer,
    isAppraiser,
    isStaff,
    isViewer
  } = useAuth();

  const capabilities: PermissionCapabilities = useMemo(() => {

    if (!user) {
      return {
        canManageAllUsers: false,
        canViewUsers: false,
        canCreateUsers: false,
        canDeleteUsers: false,
        canManageAllArtworks: false,
        canCreateArtworks: false,
        canViewArtworks: false,
        canDeleteArtworks: false,
        canManageAllNfcTags: false,
        canAttachNfcTags: false,
        canIssueNfcTags: false,
        canManageAllAppraisals: false,
        canCreateAppraisals: false,
        canUpdateAppraisals: false,
        canViewAppraisalDetails: false,
        canViewAllStatistics: false,
        canViewPublicStatistics: false,
        canManageSystem: false,
        canExportData: false,
      };
    }

    return {
      // User management - simplified for single tenant
      canManageAllUsers: hasPermission('manage_all_users') || isAdmin,
      canViewUsers: hasPermission('manage_all_users') || isAdmin,
      canCreateUsers: hasPermission('manage_all_users') || isAdmin,
      canDeleteUsers: hasPermission('manage_all_users') || isAdmin,
      
      // Artwork management
      canManageAllArtworks: hasPermission('manage_all_artworks') || isAdmin,
      canCreateArtworks: hasPermission('create_artworks') || hasPermission('manage_artworks') || hasPermission('manage_all_artworks') || isAdmin,
      canViewArtworks: hasPermission('view_artworks') || hasPermission('manage_all_artworks') || isAdmin || isStaff || isViewer,
      canDeleteArtworks: hasPermission('manage_all_artworks') || isAdmin,
      
      // NFC tag management
      canManageAllNfcTags: hasPermission('manage_all_nfc_tags') || hasPermission('manage_nfc_tags') || isAdmin,
      canAttachNfcTags: hasPermission('attach_nfc_tags') || hasPermission('manage_all_nfc_tags') || isAdmin || isIssuer,
      canIssueNfcTags: hasPermission('manage_nfc_tags') || hasPermission('manage_all_nfc_tags') || isAdmin || isIssuer,
      
      // Appraisal management
      canManageAllAppraisals: hasPermission('manage_all_appraisals') || hasPermission('manage_appraisals') || isAdmin,
      canCreateAppraisals: hasPermission('create_appraisals') || hasPermission('manage_appraisals') || isAdmin || isAppraiser,
      canUpdateAppraisals: hasPermission('update_appraisals') || hasPermission('manage_appraisals') || isAdmin || isAppraiser,
      canViewAppraisalDetails: hasPermission('view_artwork_details') || hasPermission('manage_appraisals') || isAdmin || isAppraiser || isStaff,
      
      // Statistics and reporting
      canViewAllStatistics: hasPermission('view_all_statistics') || hasPermission('view_statistics') || isAdmin,
      canViewPublicStatistics: hasPermission('view_public_statistics') || true, // Everyone can view public stats
      canExportData: hasPermission('export_data') || isAdmin,
      
      // System management
      canManageSystem: hasPermission('manage_system') || isAdmin,
    };
  }, [user, hasPermission, isAdmin, isIssuer, isAppraiser, isStaff, isViewer]);

  return capabilities;
};