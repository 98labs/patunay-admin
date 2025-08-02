import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  selectAuth,
  selectOrganizations,
  loadUserOrganizations 
} from '../store/features/auth/authSliceV2';

// Custom hook to handle organization loading with deduplication
export const useOrganizationLoader = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const organizations = useAppSelector(selectOrganizations);
  
  // Track if we're already loading to prevent duplicate requests
  const loadingRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if:
    // 1. No user ID
    // 2. Already loading organizations
    // 3. Organizations already loaded for this user
    // 4. Currently loading (via ref to handle React strict mode)
    if (
      !auth.userId || 
      auth.isLoadingOrganizations ||
      loadingRef.current ||
      (organizations.length > 0 && lastUserIdRef.current === auth.userId)
    ) {
      return;
    }

    // Mark as loading
    loadingRef.current = true;
    lastUserIdRef.current = auth.userId;

    // Load organizations with error handling
    dispatch(loadUserOrganizations(auth.userId))
      .finally(() => {
        // Reset loading flag after completion
        loadingRef.current = false;
      });
  }, [dispatch, auth.userId, auth.isLoadingOrganizations, organizations.length]);

  return {
    organizations,
    isLoading: auth.isLoadingOrganizations,
    error: auth.error
  };
};

// Hook to ensure organizations are loaded before rendering
export const useRequireOrganizations = () => {
  const { organizations, isLoading } = useOrganizationLoader();
  const auth = useAppSelector(selectAuth);
  
  // Return loading state while organizations are being loaded
  const isReady = !isLoading && (organizations.length > 0 || !auth.isAuthenticated);
  
  return {
    isReady,
    isLoading,
    organizations
  };
};