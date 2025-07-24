import React from 'react';
import { useCanPerform, useHasRole } from '../../hooks/useOpenFGA';
import { UserRole } from '../../typings/user';

interface OpenFGAPermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  role?: UserRole;
  resourceId?: string;
  organizationId?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const OpenFGAPermissionGuard: React.FC<OpenFGAPermissionGuardProps> = ({
  children,
  permission,
  role,
  resourceId,
  organizationId,
  fallback = null,
  loadingComponent = <div>Checking permissions...</div>,
}) => {
  const permissionCheck = permission 
    ? useCanPerform(permission, resourceId, organizationId)
    : { can: true, loading: false };
    
  const roleCheck = role && organizationId
    ? useHasRole(role, organizationId)
    : { can: true, loading: false };

  const loading = permissionCheck.loading || roleCheck.loading;
  const hasAccess = permissionCheck.can && roleCheck.can;

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};