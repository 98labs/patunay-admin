import React, { useEffect, useState } from 'react';
import { useGetCurrentUserQuery, useGetUserQuery } from '../store/api/userApi';
import { User, UserRole, Organization, OrganizationUser, DEFAULT_PERMISSIONS } from '../typings';
import supabase from '../supabase';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentOrganization: Organization | null;
  organizations: OrganizationUser[];
  hasRole: (role: UserRole, organizationId?: string) => boolean;
  hasPermission: (permission: string, organizationId?: string) => boolean;
  canPerform: (action: string, organizationId?: string) => boolean;
  switchOrganization: (organizationId: string) => void;
  // Legacy role checks for backward compatibility
  isAdmin: boolean;
  isStaff: boolean;
  // New role checks
  isSuperUser: boolean;
  isIssuer: boolean;
  isAppraiser: boolean;
  isViewer: boolean;
}

export const useAuth = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationUser[]>([]);

  const { 
    data: userResponse, 
    isLoading: isLoadingUser, 
    refetch 
  } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true, // Always refetch on mount
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

  // Get current organization context
  const currentOrganization = organizations.find(
    org => org.organization_id === currentOrganizationId
  )?.organization || null;

  // Role checking with organization context
  const hasRole = (role: UserRole, organizationId?: string): boolean => {
    const targetOrgId = organizationId || currentOrganizationId;
    
    // Super users have all roles everywhere
    if (user?.role === 'super_user') return true;
    
    // Check role in specific organization
    if (targetOrgId) {
      const orgMembership = organizations.find(org => org.organization_id === targetOrgId);
      return orgMembership?.role === role;
    }
    
    // Fallback to primary role
    return user?.role === role;
  };

  // Permission checking with organization context
  const hasPermission = (permission: string, organizationId?: string): boolean => {
    const targetOrgId = organizationId || currentOrganizationId;
    
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
    
    // Fallback to user permissions array
    return user?.permissions?.includes(permission) || false;
  };

  // Enhanced permission checking for specific actions
  const canPerform = (action: string, organizationId?: string): boolean => {
    return hasPermission(action, organizationId);
  };

  // Organization switching
  const switchOrganization = (organizationId: string) => {
    const orgExists = organizations.some(org => org.organization_id === organizationId);
    if (orgExists) {
      setCurrentOrganizationId(organizationId);
      // Store in localStorage for persistence
      localStorage.setItem('currentOrganizationId', organizationId);
    }
  };

  // Role checks
  const isSuperUser = hasRole('super_user');
  const isAdmin = hasRole('admin');
  const isIssuer = hasRole('issuer');
  const isAppraiser = hasRole('appraiser');
  const isStaff = hasRole('staff');
  const isViewer = hasRole('viewer');

  // Load user organizations when user data is available
  useEffect(() => {
    const loadUserOrganizations = async () => {
      if (!user?.id) return;
      
      try {
        const { data: userOrgs, error } = await supabase
          .from('organization_users')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (error) {
          console.error('Error loading user organizations:', error);
          return;
        }
        
        setOrganizations(userOrgs || []);
        
        // Set current organization
        if (userOrgs && userOrgs.length > 0) {
          // Try to use stored organization or primary organization
          const storedOrgId = localStorage.getItem('currentOrganizationId');
          const primaryOrg = userOrgs.find(org => org.is_primary);
          const targetOrg = userOrgs.find(org => org.organization_id === storedOrgId) || primaryOrg || userOrgs[0];
          
          if (targetOrg) {
            setCurrentOrganizationId(targetOrg.organization_id);
          }
        }
      } catch (error) {
        console.error('Error in loadUserOrganizations:', error);
      }
    };
    
    loadUserOrganizations();
  }, [user?.id]);


  return {
    user,
    isLoading: !isInitialized || (isAuthenticated && isLoadingUser),
    isAuthenticated,
    currentOrganization,
    organizations,
    hasRole,
    hasPermission,
    canPerform,
    switchOrganization,
    // Legacy role checks
    isAdmin,
    isStaff,
    // New role checks
    isSuperUser,
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