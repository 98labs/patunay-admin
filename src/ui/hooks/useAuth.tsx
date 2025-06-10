import React, { useEffect, useState } from 'react';
import { useGetCurrentUserQuery, useGetUserQuery } from '../store/api/userApi';
import { User, UserRole } from '../typings';
import supabase from '../supabase';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

export const useAuth = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { 
    data: userResponse, 
    isLoading: isLoadingUser, 
    refetch 
  } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { 
    data: userResponseByID, 
  } = useGetUserQuery(userId!, {
    skip: !isAuthenticated,
  });

  const user = userResponse?.user || null;

  useEffect(() => {
    // Check initial auth state
    const checkAuthState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUserId(session?.user?.id || null);
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session);
        
        if (event === 'SIGNED_IN' && session) {
          // Refetch user data when signed in
          refetch();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refetch]);

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role || userResponseByID?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const isAdmin = hasRole('admin');
  const isStaff = hasRole('staff');

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('[useAuth] User data:', {
        id: user.id,
        email: user.email,
        role: user.role || userResponseByID?.role,
        isAdmin,
        isStaff,
        permissions: user.permissions
      });
    }
  }, [user, isAdmin, isStaff]);

  return {
    user,
    isLoading: !isInitialized || (isAuthenticated && isLoadingUser),
    isAuthenticated,
    hasRole,
    hasPermission,
    isAdmin,
    isStaff,
  };
};

// Higher-order component for role-based access control
export const withRoleAccess = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole,
  requiredPermission?: string
) => {
  return (props: P) => {
    const { hasRole, hasPermission, isLoading, user } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      );
    }

    // Check role access
    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="alert alert-error">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-bold">Access Denied</h3>
              <div className="text-xs">You need {requiredRole} role to access this page.</div>
            </div>
          </div>
        </div>
      );
    }

    // Check permission access
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="alert alert-error">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-bold">Insufficient Permissions</h3>
              <div className="text-xs">You need the '{requiredPermission}' permission to access this page.</div>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook for checking if current user can perform an action
export const useCanPerform = () => {
  const { hasRole, hasPermission, isAdmin } = useAuth();

  const canManageUsers = isAdmin || hasPermission('manage_users');
  const canManageArtworks = hasPermission('manage_artworks');
  const canManageNFC = hasPermission('manage_nfc_tags');
  const canViewStatistics = hasPermission('view_statistics');
  const canManageSystem = isAdmin || hasPermission('manage_system');
  const canManageAppraisals = isAdmin || hasPermission('manage_appraisals');

  return {
    canManageUsers,
    canManageArtworks,
    canManageNFC,
    canViewStatistics,
    canManageSystem,
    canManageAppraisals,
    hasRole,
    hasPermission,
    isAdmin,
  };
};