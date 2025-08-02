import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, UserRole, Organization, OrganizationUser } from '../../../typings';
import supabase from '../../../supabase';
import type { RootState } from '../../store';

// Unified auth state interface
export interface AuthState {
  // User data
  user: User | null;
  userId: string | null;
  
  // Session data
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  
  // Organization data
  organizations: OrganizationUser[];
  currentOrganizationId: string | null;
  currentOrganization: Organization | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  isLoadingOrganizations: boolean;
  
  // Auth state
  isAuthenticated: boolean;
  
  // Error handling
  error: string | null;
  
  // Metadata
  lastLoginAt?: string;
  lastRefreshAt?: string;
}

const initialState: AuthState = {
  user: null,
  userId: null,
  session: null,
  organizations: [],
  currentOrganizationId: null,
  currentOrganization: null,
  isLoading: false,
  isInitialized: false,
  isLoadingOrganizations: false,
  isAuthenticated: false,
  error: null,
};

// Track ongoing requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

// Async thunks for auth operations
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    
    // Try to get session with retry logic
    let session = null;
    let retries = 3;
    
    while (retries > 0) {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Failed to get session:', sessionError);
        throw sessionError;
      }
      
      if (currentSession) {
        session = currentSession;
        break;
      }
      
      if (retries > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      retries--;
    }
    
    if (!session) {
      return null;
    }
    
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      // Don't throw here, just log and continue with basic user data
    }
    
    const userData = profile ? {
      ...profile,
      email: session.user.email || profile.email || ''
    } : {
      id: session.user.id,
      email: session.user.email || '',
      role: 'viewer' as const,
      is_active: true,
      created_at: session.user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
      
    return {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || 0
      },
      user: userData
    };
  }
);

export const loadUserOrganizations = createAsyncThunk(
  'auth/loadOrganizations',
  async (userId: string, { getState }) => {
    // Check if we already have a pending request for this user
    const requestKey = `org-${userId}`;
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }
    
    // Check if organizations are already loaded
    const state = getState() as RootState;
    if (state.auth.organizations.length > 0 && !state.auth.error) {
      return state.auth.organizations;
    }
    
    // Create new request
    const request = supabase
      .from('organization_users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
      .finally(() => {
        // Clean up pending request
        pendingRequests.delete(requestKey);
      });
    
    // Store pending request
    pendingRequests.set(requestKey, request);
    
    return request;
  },
  {
    // Prevent duplicate requests while one is in flight
    condition: (userId, { getState }) => {
      const state = getState() as RootState;
      return !state.auth.isLoadingOrganizations;
    }
  }
);

export const switchOrganization = createAsyncThunk(
  'auth/switchOrganization',
  async (organizationId: string, { getState }) => {
    const state = getState() as RootState;
    const orgExists = state.auth.organizations.some(
      org => org.organization_id === organizationId
    );
    
    if (!orgExists) {
      throw new Error('Organization not found');
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('currentOrganizationId', organizationId);
    
    return organizationId;
  }
);

export const refreshUserData = createAsyncThunk(
  'auth/refreshUserData',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const userId = state.auth.userId;
    
    if (!userId) throw new Error('No user ID');
    
    // Get fresh user data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    // Get fresh auth data
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    return {
      ...profile,
      email: authUser?.email || profile.email || ''
    };
  }
);

// Create the slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Manual state updates
    setSession: (state, action: PayloadAction<AuthState['session']>) => {
      state.session = action.payload;
      state.isAuthenticated = !!action.payload;
      if (!action.payload) {
        // Clear user data on logout
        state.user = null;
        state.userId = null;
        state.organizations = [];
        state.currentOrganizationId = null;
        state.currentOrganization = null;
      }
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearAuth: (state) => {
      return {
        ...initialState,
        isInitialized: true
      };
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        
        if (action.payload) {
          state.session = action.payload.session;
          state.user = action.payload.user;
          state.userId = action.payload.user.id;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.error.message || 'Failed to initialize auth';
      });
      
    // Load organizations
    builder
      .addCase(loadUserOrganizations.pending, (state) => {
        state.isLoadingOrganizations = true;
      })
      .addCase(loadUserOrganizations.fulfilled, (state, action) => {
        state.isLoadingOrganizations = false;
        state.organizations = action.payload;
        
        // Set current organization
        if (action.payload.length > 0) {
          const storedOrgId = localStorage.getItem('currentOrganizationId');
          const primaryOrg = action.payload.find(org => org.is_primary);
          const targetOrg = action.payload.find(org => org.organization_id === storedOrgId) 
            || primaryOrg 
            || action.payload[0];
            
          if (targetOrg) {
            state.currentOrganizationId = targetOrg.organization_id;
            state.currentOrganization = targetOrg.organization;
          }
        }
      })
      .addCase(loadUserOrganizations.rejected, (state, action) => {
        state.isLoadingOrganizations = false;
        state.error = action.error.message || 'Failed to load organizations';
      });
      
    // Switch organization
    builder
      .addCase(switchOrganization.fulfilled, (state, action) => {
        state.currentOrganizationId = action.payload;
        const org = state.organizations.find(
          o => o.organization_id === action.payload
        );
        state.currentOrganization = org?.organization || null;
      });
      
    // Refresh user data
    builder
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.lastRefreshAt = new Date().toISOString();
      });
  },
});

// Export actions
export const { setSession, setError, clearAuth, updateUser } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentOrganization = (state: RootState) => state.auth.currentOrganization;
export const selectOrganizations = (state: RootState) => state.auth.organizations;
export const selectIsLoading = (state: RootState) => 
  state.auth.isLoading || state.auth.isLoadingOrganizations || !state.auth.isInitialized;

// Role and permission selectors
export const selectHasRole = (role: UserRole, organizationId?: string) => (state: RootState) => {
  const { user, currentOrganizationId, organizations } = state.auth;
  const targetOrgId = organizationId || currentOrganizationId;
  
  // Super users have all roles
  if (user?.role === 'super_user') return true;
  
  // Check role in specific organization
  if (targetOrgId) {
    const orgMembership = organizations.find(org => org.organization_id === targetOrgId);
    return orgMembership?.role === role;
  }
  
  // Fallback to primary role
  return user?.role === role;
};

export const selectIsSuperUser = (state: RootState) => state.auth.user?.role === 'super_user';
export const selectIsAdmin = (state: RootState) => selectHasRole('admin')(state);
export const selectIsIssuer = (state: RootState) => selectHasRole('issuer')(state);
export const selectIsAppraiser = (state: RootState) => selectHasRole('appraiser')(state);
export const selectIsStaff = (state: RootState) => selectHasRole('staff')(state);
export const selectIsViewer = (state: RootState) => selectHasRole('viewer')(state);

export default authSlice.reducer;