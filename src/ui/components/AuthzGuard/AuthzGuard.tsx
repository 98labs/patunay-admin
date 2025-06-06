/**
 * Authorization guard component for route protection
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthzPermission, useAuthzBatchCheck } from '../../hooks/useAuthz';
import { useAuth } from '../../hooks/useAuth';
import { Loading } from '../Loading';
import type { Namespace } from '../../services/authz';

interface AuthzGuardProps {
  children: React.ReactNode;
  namespace?: Namespace;
  objectId?: string;
  relation?: string;
  checks?: Array<{
    namespace: Namespace;
    objectId: string;
    relation: string;
  }>;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

/**
 * Component to protect routes based on authz permissions
 */
export const AuthzGuard: React.FC<AuthzGuardProps> = ({
  children,
  namespace,
  objectId,
  relation,
  checks,
  requireAll = false,
  fallback,
  redirectTo = '/dashboard',
  onUnauthorized
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Single permission check
  const singleCheck = useAuthzPermission(
    namespace || 'system',
    objectId || 'global',
    relation || 'admin'
  );

  // Batch permission check
  const batchCheck = useAuthzBatchCheck(checks || []);

  // Determine which check to use
  const isUsingBatch = !!checks && checks.length > 0;
  const hasPermission = isUsingBatch
    ? requireAll
      ? batchCheck.results.every(r => r)
      : batchCheck.results.some(r => r)
    : singleCheck.hasPermission;
  
  const isLoading = authLoading || (isUsingBatch ? batchCheck.isLoading : singleCheck.isLoading);

  useEffect(() => {
    if (!isLoading && !hasPermission && onUnauthorized) {
      onUnauthorized();
    }
  }, [isLoading, hasPermission, onUnauthorized]);

  // Show loading state
  if (isLoading) {
    return <Loading fullScreen />;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not authorized
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Authorized
  return <>{children}</>;
};

/**
 * HOC to protect components with authz
 */
export function withAuthz<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthzGuardProps, 'children'>
): React.ComponentType<P> {
  return (props: P) => (
    <AuthzGuard {...options}>
      <Component {...props} />
    </AuthzGuard>
  );
}

/**
 * Component to conditionally render based on permissions
 */
interface CanProps {
  namespace: Namespace;
  objectId: string;
  relation: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  namespace,
  objectId,
  relation,
  children,
  fallback = null
}) => {
  const { hasPermission, isLoading } = useAuthzPermission(namespace, objectId, relation);

  if (isLoading) {
    return null;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

/**
 * Component to conditionally render based on multiple permissions
 */
interface CanAnyProps {
  checks: Array<{
    namespace: Namespace;
    objectId: string;
    relation: string;
  }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const CanAny: React.FC<CanAnyProps> = ({
  checks,
  children,
  fallback = null
}) => {
  const { results, isLoading } = useAuthzBatchCheck(checks);

  if (isLoading) {
    return null;
  }

  const hasAnyPermission = results.some(r => r);
  return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
};

/**
 * Component to conditionally render based on all permissions
 */
interface CanAllProps {
  checks: Array<{
    namespace: Namespace;
    objectId: string;
    relation: string;
  }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const CanAll: React.FC<CanAllProps> = ({
  checks,
  children,
  fallback = null
}) => {
  const { results, isLoading } = useAuthzBatchCheck(checks);

  if (isLoading) {
    return null;
  }

  const hasAllPermissions = results.every(r => r);
  return hasAllPermissions ? <>{children}</> : <>{fallback}</>;
};