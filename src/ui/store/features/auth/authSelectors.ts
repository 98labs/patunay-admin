import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selector
const selectAuthState = (state: RootState) => state.auth;

// Auth selectors
export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectSession = createSelector(
  [selectAuthState],
  (auth) => auth.session
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.isAuthenticated
);

export const selectIsLoading = createSelector(
  [selectAuthState],
  (auth) => auth.isLoading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);

export const selectUserRole = createSelector(
  [selectUser],
  (user) => user?.role
);

export const selectUserPreferences = createSelector(
  [selectAuthState],
  (auth) => auth.preferences
);

export const selectIsAdmin = createSelector(
  [selectUserRole],
  (role) => role === 'admin'
);

export const selectCanManageUsers = createSelector(
  [selectUserRole],
  (role) => role === 'admin'
);

export const selectCanManageArtworks = createSelector(
  [selectUserRole],
  (role) => role === 'admin' || role === 'user'
);

export const selectCanViewOnly = createSelector(
  [selectUserRole],
  (role) => role === 'viewer'
);

export const selectTheme = createSelector(
  [selectUserPreferences],
  (preferences) => preferences.theme
);

export const selectNotificationSettings = createSelector(
  [selectUserPreferences],
  (preferences) => preferences.notifications
);

export const selectSessionExpiresAt = createSelector(
  [selectSession],
  (session) => session?.expires_at
);

export const selectIsSessionExpired = createSelector(
  [selectSessionExpiresAt],
  (expiresAt) => {
    if (!expiresAt) return true;
    return Date.now() > expiresAt * 1000;
  }
);

export const selectAuthSummary = createSelector(
  [
    selectIsAuthenticated,
    selectUser,
    selectIsLoading,
    selectAuthError,
    selectIsSessionExpired,
  ],
  (isAuthenticated, user, isLoading, error, isExpired) => ({
    isAuthenticated: isAuthenticated && !isExpired,
    user,
    isLoading,
    error,
    needsReauth: isExpired,
  })
);