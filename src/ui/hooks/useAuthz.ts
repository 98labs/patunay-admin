/**
 * React hooks for Zanzibar-style authorization
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { authzService } from '../services/authz';
import type { Namespace, AuthzObject, LegacyPermission } from '../services/authz';

/**
 * Hook to check a specific permission
 */
export function useAuthzPermission(
  namespace: Namespace,
  objectId: string,
  relation: string
) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkPermission = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await authzService.check(
          namespace,
          objectId,
          relation,
          'user',
          user.id
        );
        
        if (!cancelled) {
          setHasPermission(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setHasPermission(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkPermission();

    return () => {
      cancelled = true;
    };
  }, [namespace, objectId, relation, user]);

  return { hasPermission, isLoading, error };
}

/**
 * Hook to check multiple permissions at once
 */
export function useAuthzBatchCheck(
  checks: Array<{
    namespace: Namespace;
    objectId: string;
    relation: string;
  }>
) {
  const { user } = useAuth();
  const [results, setResults] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create a stable key for the checks to avoid unnecessary re-renders
  const checksKey = useMemo(
    () => JSON.stringify(checks),
    [checks]
  );

  useEffect(() => {
    if (!user) {
      setResults(checks.map(() => false));
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const checksWithUser = checks.map(check => ({
          ...check,
          subjectNamespace: 'user' as Namespace,
          subjectId: user.id
        }));

        const results = await authzService.batchCheck(checksWithUser);
        
        if (!cancelled) {
          setResults(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setResults(checks.map(() => false));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkPermissions();

    return () => {
      cancelled = true;
    };
  }, [checksKey, user]);

  return { results, isLoading, error };
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    authzService.isCurrentUserAdmin()
      .then(setIsAdmin)
      .finally(() => setIsLoading(false));
  }, [user]);

  return { isAdmin, isLoading };
}

/**
 * Hook to check if user is in a group
 */
export function useIsInGroup(groupId: string) {
  const { user } = useAuth();
  const [isInGroup, setIsInGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsInGroup(false);
      setIsLoading(false);
      return;
    }

    authzService.isUserInGroup(user.id, groupId)
      .then(setIsInGroup)
      .finally(() => setIsLoading(false));
  }, [user, groupId]);

  return { isInGroup, isLoading };
}

/**
 * Hook to get current user's permissions
 */
export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<AuthzObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    authzService.listCurrentUserPermissions()
      .then(setPermissions)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const perms = await authzService.listCurrentUserPermissions();
      setPermissions(perms);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { permissions, isLoading, error, refresh };
}

/**
 * Hook for legacy permission checking (backward compatibility)
 */
export function useLegacyPermission(permission: LegacyPermission) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    authzService.checkLegacyPermission(user.id, permission)
      .then(setHasPermission)
      .finally(() => setIsLoading(false));
  }, [user, permission]);

  return { hasPermission, isLoading };
}

/**
 * Hook to manage permissions (grant/revoke)
 */
export function useAuthzManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const grant = useCallback(async (
    namespace: Namespace,
    objectId: string,
    relation: string,
    subjectNamespace: Namespace,
    subjectId: string,
    subjectRelation?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await authzService.grant(
        namespace,
        objectId,
        relation,
        subjectNamespace,
        subjectId,
        subjectRelation
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revoke = useCallback(async (
    namespace: Namespace,
    objectId: string,
    relation: string,
    subjectNamespace: Namespace,
    subjectId: string,
    subjectRelation?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await authzService.revoke(
        namespace,
        objectId,
        relation,
        subjectNamespace,
        subjectId,
        subjectRelation
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addUserToGroup = useCallback(async (userId: string, groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authzService.addUserToGroup(userId, groupId);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeUserFromGroup = useCallback(async (userId: string, groupId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authzService.removeUserFromGroup(userId, groupId);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    grant,
    revoke,
    addUserToGroup,
    removeUserFromGroup,
    isLoading,
    error
  };
}

/**
 * Hook to check permissions for specific features
 */
export function useFeaturePermissions() {
  const checks = useMemo(() => [
    { namespace: 'system' as Namespace, objectId: 'global', relation: 'user_manager' },
    { namespace: 'artwork' as Namespace, objectId: '*', relation: 'editor' },
    { namespace: 'nfc_tag' as Namespace, objectId: '*', relation: 'manager' },
    { namespace: 'system' as Namespace, objectId: 'global', relation: 'statistics_viewer' },
    { namespace: 'system' as Namespace, objectId: 'global', relation: 'admin' },
    { namespace: 'appraisal' as Namespace, objectId: '*', relation: 'editor' }
  ], []);

  const { results, isLoading } = useAuthzBatchCheck(checks);

  return {
    canManageUsers: results[0] || false,
    canManageArtworks: results[1] || false,
    canManageNfcTags: results[2] || false,
    canViewStatistics: results[3] || false,
    isSystemAdmin: results[4] || false,
    canManageAppraisals: results[5] || false,
    isLoading
  };
}