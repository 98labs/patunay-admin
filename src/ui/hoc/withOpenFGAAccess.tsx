import React, { ComponentType, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useCanPerform, useHasRole } from '../hooks/useOpenFGA';
import { UserRole } from '../typings/user';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../store/features/auth/authSlice';

interface WithOpenFGAAccessOptions {
  role?: UserRole;
  permission?: string;
  redirectTo?: string;
  loadingComponent?: React.ComponentType;
  useOrgFromParams?: boolean;
}

export function withOpenFGAAccess<P extends object>(
  Component: ComponentType<P>,
  options: WithOpenFGAAccessOptions = {}
): ComponentType<P> {
  const {
    role,
    permission,
    redirectTo = '/unauthorized',
    loadingComponent: LoadingComponent = () => <div>Loading...</div>,
    useOrgFromParams = true,
  } = options;

  return function OpenFGAProtectedComponent(props: P) {
    const { isAuthenticated } = useAppSelector(selectAuth);
    const params = useParams();
    const [organizationId, setOrganizationId] = useState<string | undefined>();

    useEffect(() => {
      if (useOrgFromParams && params.organizationId) {
        setOrganizationId(params.organizationId);
      }
    }, [params.organizationId, useOrgFromParams]);

    const permissionCheck = permission && organizationId
      ? useCanPerform(permission, undefined, organizationId)
      : { can: true, loading: false };

    const roleCheck = role && organizationId
      ? useHasRole(role, organizationId)
      : { can: true, loading: false };

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (permissionCheck.loading || roleCheck.loading) {
      return <LoadingComponent />;
    }

    const hasAccess = permissionCheck.can && roleCheck.can;

    if (!hasAccess) {
      return <Navigate to={redirectTo} replace />;
    }

    return <Component {...props} />;
  };
}