import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectHasRole,
  selectIsAdmin,
  selectIsIssuer,
  selectIsAppraiser,
  selectIsStaff,
  selectIsViewer,
  initializeAuth,
  setSession,
  clearAuth,
  refreshUserData
} from '../store/features/auth/authSlice';
import { UserRole, DEFAULT_PERMISSIONS } from '../typings';
import supabase from '../supabase';

export interface AuthState {
  user: ReturnType<typeof selectUser>;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  canPerform: (action: string) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  // Role checks
  isAdmin: boolean;
  isStaff: boolean;
  isIssuer: boolean;
  isAppraiser: boolean;
  isViewer: boolean;
}

export const useAuth = (): AuthState => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  
  // Role selectors
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
  const hasRole = (role: UserRole): boolean => {
    // Check if user has the specific role
    return user?.role === role;
  };

  // Permission checking function
  const hasPermission = (permission: string): boolean => {
    // Check user's role permissions
    const rolePermission = user?.role ? DEFAULT_PERMISSIONS[user.role]?.includes(permission) : false;
    const userPermission = user?.permissions?.includes(permission) || false;
    
    return rolePermission || userPermission;
  };

  // Enhanced permission checking for specific actions
  const canPerform = (action: string): boolean => {
    return hasPermission(action);
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
    hasRole,
    hasPermission,
    canPerform,
    refreshUser,
    logout,
    // Role checks
    isAdmin,
    isStaff,
    isIssuer,
    isAppraiser,
    isViewer,
  };
};

// Higher-order component for role-based access control
export const withRoleAccess = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole,
  requiredPermission?: string
) => {
  return (props: P) => {
    const { hasRole, hasPermission, isLoading } = useAuth();

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