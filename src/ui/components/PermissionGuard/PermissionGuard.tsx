import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { UserRole } from '../../typings';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  role?: UserRole;
  organizationId?: string;
  requireAll?: boolean; // If true, require all permissions/roles
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  role,
  organizationId,
  requireAll = false,
  fallback = null,
  showError = false
}) => {
  const { hasPermission, hasRole } = usePermissions(organizationId);

  const hasRequiredPermission = permission ? hasPermission(permission, organizationId) : true;
  const hasRequiredRole = role ? hasRole(role, organizationId) : true;

  let hasAccess: boolean;
  
  if (requireAll) {
    // Require both permission AND role if both are specified
    hasAccess = hasRequiredPermission && hasRequiredRole;
  } else {
    // Require either permission OR role (if only one is specified, use that)
    if (permission && role) {
      hasAccess = hasRequiredPermission || hasRequiredRole;
    } else {
      hasAccess = hasRequiredPermission && hasRequiredRole;
    }
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <div className="text-red-700 font-medium">Access Denied</div>
          <div className="text-red-600 text-sm mt-1">
            You don't have permission to access this content.
            {permission && ` Required permission: ${permission}`}
            {role && ` Required role: ${role}`}
          </div>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Specific permission guards for common use cases
export const AdminGuard: React.FC<{ children: React.ReactNode; organizationId?: string; fallback?: React.ReactNode }> = 
  ({ children, organizationId, fallback }) => (
    <PermissionGuard role="admin" organizationId={organizationId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );

export const SuperUserGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = 
  ({ children, fallback }) => (
    <PermissionGuard role="super_user" fallback={fallback}>
      {children}
    </PermissionGuard>
  );

export const IssuerGuard: React.FC<{ children: React.ReactNode; organizationId?: string; fallback?: React.ReactNode }> = 
  ({ children, organizationId, fallback }) => (
    <PermissionGuard role="issuer" organizationId={organizationId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );

export const AppraiserGuard: React.FC<{ children: React.ReactNode; organizationId?: string; fallback?: React.ReactNode }> = 
  ({ children, organizationId, fallback }) => (
    <PermissionGuard role="appraiser" organizationId={organizationId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );

// Permission-specific guards
export const UserManagementGuard: React.FC<{ children: React.ReactNode; organizationId?: string; fallback?: React.ReactNode }> = 
  ({ children, organizationId, fallback }) => (
    <PermissionGuard permission="manage_org_users" organizationId={organizationId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );

export const ArtworkManagementGuard: React.FC<{ children: React.ReactNode; organizationId?: string; fallback?: React.ReactNode }> = 
  ({ children, organizationId, fallback }) => (
    <PermissionGuard permission="manage_artworks" organizationId={organizationId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );

export const NfcManagementGuard: React.FC<{ children: React.ReactNode; organizationId?: string; fallback?: React.ReactNode }> = 
  ({ children, organizationId, fallback }) => (
    <PermissionGuard permission="manage_nfc_tags" organizationId={organizationId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );

export const AppraisalManagementGuard: React.FC<{ children: React.ReactNode; organizationId?: string; fallback?: React.ReactNode }> = 
  ({ children, organizationId, fallback }) => (
    <PermissionGuard permission="manage_appraisals" organizationId={organizationId} fallback={fallback}>
      {children}
    </PermissionGuard>
  );