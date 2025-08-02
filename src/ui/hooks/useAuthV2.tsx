import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectCurrentOrganization,
  selectOrganizations,
  selectIsLoading,
  selectHasRole,
  selectIsSuperUser,
  selectIsAdmin,
  selectIsIssuer,
  selectIsAppraiser,
  selectIsStaff,
  selectIsViewer,
  initializeAuth,
  loadUserOrganizations,
  switchOrganization as switchOrganizationAction,
  setSession,
  clearAuth,
  refreshUserData
} from '../store/features/auth/authSliceV2';
import { UserRole, DEFAULT_PERMISSIONS } from '../typings';
import supabase from '../supabase';

export interface AuthStateV2 {
  user: ReturnType<typeof selectUser>;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentOrganization: ReturnType<typeof selectCurrentOrganization>;
  organizations: ReturnType<typeof selectOrganizations>;
  hasRole: (role: UserRole, organizationId?: string) => boolean;
  hasPermission: (permission: string, organizationId?: string) => boolean;
  canPerform: (action: string, organizationId?: string) => boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  // Role checks
  isAdmin: boolean;
  isStaff: boolean;
  isSuperUser: boolean;
  isIssuer: boolean;
  isAppraiser: boolean;
  isViewer: boolean;
}

export const useAuthV2 = (): AuthStateV2 => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentOrganization = useAppSelector(selectCurrentOrganization);
  const organizations = useAppSelector(selectOrganizations);
  const isLoading = useAppSelector(selectIsLoading);
  
  // Role selectors
  const isSuperUser = useAppSelector(selectIsSuperUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isIssuer = useAppSelector(selectIsIssuer);
  const isAppraiser = useAppSelector(selectIsAppraiser);
  const isStaff = useAppSelector(selectIsStaff);
  const isViewer = useAppSelector(selectIsViewer);

  // Initialize auth on mount
  useEffect(() => {
    if (!auth.isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, auth.isInitialized]);

  // Load organizations when user is available
  useEffect(() => {
    if (auth.userId && organizations.length === 0 && !auth.isLoadingOrganizations) {
      dispatch(loadUserOrganizations(auth.userId));
    }
  }, [dispatch, auth.userId, organizations.length, auth.isLoadingOrganizations]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          dispatch(setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0
          }));
          
          // Reinitialize to get fresh user data
          dispatch(initializeAuth());
        } else if (event === 'SIGNED_OUT') {
          dispatch(clearAuth());
        } else if (event === 'TOKEN_REFRESHED' && session) {
          dispatch(setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch]);

  // Role checking function
  const hasRole = (role: UserRole, organizationId?: string): boolean => {
    const targetOrgId = organizationId || auth.currentOrganizationId;
    
    // If checking for super_user specifically, only check the actual role
    if (role === 'super_user') {
      return user?.role === 'super_user';
    }
    
    // Super users have all OTHER roles everywhere
    if (user?.role === 'super_user') return true;
    
    // Check role in specific organization
    if (targetOrgId) {
      const orgMembership = organizations.find(org => org.organization_id === targetOrgId);
      return orgMembership?.role === role;
    }
    
    // Fallback to primary role
    return user?.role === role;
  };

  // Permission checking function
  const hasPermission = (permission: string, organizationId?: string): boolean => {
    const targetOrgId = organizationId || auth.currentOrganizationId;
    
    // Super users have all permissions
    if (user?.role === 'super_user') {
      return true;
    }
    
    // Check organization-specific permissions
    if (targetOrgId) {
      const orgMembership = organizations.find(org => org.organization_id === targetOrgId);
      if (orgMembership) {
        // Check role-based permissions + additional permissions
        const hasRolePermission = DEFAULT_PERMISSIONS[orgMembership.role]?.includes(permission);
        const hasAdditionalPermission = orgMembership.permissions?.includes(permission);
        
        return hasRolePermission || hasAdditionalPermission;
      }
    }
    
    // Fallback to user's primary role permissions
    const primaryRolePermission = user?.role ? DEFAULT_PERMISSIONS[user.role]?.includes(permission) : false;
    const userPermission = user?.permissions?.includes(permission) || false;
    
    return primaryRolePermission || userPermission;
  };

  // Enhanced permission checking for specific actions
  const canPerform = (action: string, organizationId?: string): boolean => {
    return hasPermission(action, organizationId);
  };

  // Organization switching
  const switchOrganization = async (organizationId: string) => {
    await dispatch(switchOrganizationAction(organizationId)).unwrap();
  };

  // Refresh user data
  const refreshUser = async () => {
    await dispatch(refreshUserData()).unwrap();
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    dispatch(clearAuth());
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    currentOrganization,
    organizations,
    hasRole,
    hasPermission,
    canPerform,
    switchOrganization,
    refreshUser,
    logout,
    // Role checks
    isAdmin,
    isStaff,
    isSuperUser,
    isIssuer,
    isAppraiser,
    isViewer,
  };
};

// Higher-order component for role-based access control
export const withRoleAccessV2 = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole,
  requiredPermission?: string
) => {
  return (props: P) => {
    const { hasRole, hasPermission, isLoading } = useAuthV2();

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