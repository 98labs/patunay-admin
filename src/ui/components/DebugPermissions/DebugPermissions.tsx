import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';

export const DebugPermissions: React.FC = () => {
  const permissions = usePermissions();
  const { user, hasPermission } = useAuth();

  console.log('🔍 Debug Permissions:', {
    user: user,
    isSuperUser: user?.role === 'super_user',
    permissions: {
      canManageOrgUsers: permissions.canManageOrgUsers,
      canManageAllUsers: permissions.canManageAllUsers,
      canCreateArtworks: permissions.canCreateArtworks,
      canManageOrgArtworks: permissions.canManageOrgArtworks,
      canManageAllArtworks: permissions.canManageAllArtworks,
      canManageOrgNfcTags: permissions.canManageOrgNfcTags,
      canManageAllNfcTags: permissions.canManageAllNfcTags,
      canManageOrganizations: permissions.canManageOrganizations,
    },
    specificPermissions: {
      'manage_all_users': hasPermission('manage_all_users'),
      'manage_all_artworks': hasPermission('manage_all_artworks'),
      'manage_all_nfc_tags': hasPermission('manage_all_nfc_tags'),
      'manage_organizations': hasPermission('manage_organizations'),
      'manage_org_users': hasPermission('manage_org_users'),
      'manage_artworks': hasPermission('manage_artworks'),
      'manage_nfc_tags': hasPermission('manage_nfc_tags'),
    }
  });

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded z-50 text-xs">
      Debug: Check console for permission details
    </div>
  );
};