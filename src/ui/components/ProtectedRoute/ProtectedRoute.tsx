import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../typings';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  role?: UserRole;
  requireAll?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  role,
  requireAll = false,
  redirectTo = '/dashboard',
  fallback
}) => {
  const { hasPermission, hasRole } = useAuth();

  const hasRequiredPermission = permission ? hasPermission(permission) : true;
  const hasRequiredRole = role ? hasRole(role) : true;

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
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

// Specific protected route components for common use cases
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute role="admin" redirectTo="/dashboard">
    {children}
  </ProtectedRoute>
);

// SuperUserRoute removed for single-tenant

export const UserManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canManageAllUsers } = usePermissions();
  const { isLoading } = useAuth();
  
  // Show loading while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (!canManageAllUsers) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export const ArtworkManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canCreateArtworks, canManageAllArtworks } = usePermissions();
  const { isLoading, hasRole } = useAuth();
  
  // Show loading while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  // Special handling for issuer role - they should always have access to artwork management
  const isIssuerRole = hasRole('issuer');
  
  // Check for issuer-specific permissions or general artwork management permissions
  const canAccess = isIssuerRole || // Issuer role always gets access
                   canCreateArtworks || 
                   canManageAllArtworks;
  
  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export const NfcManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canManageAllNfcTags, canAttachNfcTags, canIssueNfcTags } = usePermissions();
  const { isLoading, hasRole } = useAuth();
  
  // Show loading while user data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  // Special handling for issuer role - they should always have access to NFC management
  const isIssuerRole = hasRole('issuer');

  // Check for issuer-specific permissions or general NFC management permissions
  const canAccess = isIssuerRole || // Issuer role always gets access
                   canManageAllNfcTags || 
                   canAttachNfcTags ||
                   canIssueNfcTags;
  
  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export const AppraisalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute permission="create_appraisals" redirectTo="/dashboard">
    {children}
  </ProtectedRoute>
);

