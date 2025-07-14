import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '../../api/userApi';

// Enhanced auth state
export interface AuthState {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'user' | 'viewer';
    avatar_url?: string;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginAt?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      nfc: boolean;
    };
  };
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  preferences: {
    theme: 'system',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      nfc: true,
    },
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setSession: (state, action: PayloadAction<AuthState['session']>) => {
      state.session = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Partial<AuthState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle RTK Query auth actions
    builder
      .addMatcher(userApi.endpoints.login.matchPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addMatcher(userApi.endpoints.login.matchFulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = !!action.payload.user;
        state.lastLoginAt = new Date().toISOString();
      })
      .addMatcher(userApi.endpoints.login.matchRejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
      })
      .addMatcher(userApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addMatcher(userApi.endpoints.getCurrentUser.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = !!action.payload.user;
      });
  },
});

export const {
  setUser,
  setSession,
  updatePreferences,
  clearAuth,
  setError,
  clearError,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer;