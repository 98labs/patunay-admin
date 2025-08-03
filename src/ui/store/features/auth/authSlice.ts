import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, UserRole } from '../../../typings';
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
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
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
  isLoading: false,
  isInitialized: false,
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
      // Handle legacy super_user role by converting to admin
      role: profile.role === 'super_user' ? 'admin' as const : profile.role,
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
export const selectIsLoading = (state: RootState) => 
  state.auth.isLoading || !state.auth.isInitialized;

// Role and permission selectors
export const selectHasRole = (role: UserRole) => (state: RootState) => {
  const { user } = state.auth;
  
  // Check if user has the specific role
  return user?.role === role;
};

// Super user selector removed for single-tenant
export const selectIsAdmin = (state: RootState) => selectHasRole('admin')(state);
export const selectIsIssuer = (state: RootState) => selectHasRole('issuer')(state);
export const selectIsAppraiser = (state: RootState) => selectHasRole('appraiser')(state);
export const selectIsStaff = (state: RootState) => selectHasRole('staff')(state);
export const selectIsViewer = (state: RootState) => selectHasRole('viewer')(state);

export default authSlice.reducer;