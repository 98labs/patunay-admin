import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../store/features/auth/authSlice';
import { openFGA } from '../services/openfga/client';
import { formatPermissionCheck, formatUser } from '../services/openfga/helpers';
import { UserRole } from '../typings/user';

interface UseOpenFGAReturn {
  check: (permission: string, resourceId?: string, orgId?: string) => Promise<boolean>;
  checkRole: (role: UserRole, orgId: string) => Promise<boolean>;
  batchCheck: (checks: Array<{ permission: string; resourceId?: string; orgId?: string }>) => Promise<Map<string, boolean>>;
  listUserOrganizations: () => Promise<string[]>;
  loading: boolean;
  error: Error | null;
}

export function useOpenFGA(): UseOpenFGAReturn {
  const { user } = useAppSelector(selectAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const check = useCallback(async (
    permission: string,
    resourceId?: string,
    orgId?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      setLoading(true);
      setError(null);
      
      const checkParams = formatPermissionCheck(user.id, permission, resourceId, orgId);
      const result = await openFGA.check(checkParams);
      
      return result;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const checkRole = useCallback(async (
    role: UserRole,
    orgId: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      setLoading(true);
      setError(null);
      
      const result = await openFGA.check({
        user: formatUser(user.id),
        relation: role,
        object: `organization:${orgId}`,
      });
      
      return result;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const batchCheck = useCallback(async (
    checks: Array<{ permission: string; resourceId?: string; orgId?: string }>
  ): Promise<Map<string, boolean>> => {
    if (!user?.id) return new Map();

    try {
      setLoading(true);
      setError(null);
      
      const checkParams = checks.map(check => 
        formatPermissionCheck(user.id, check.permission, check.resourceId, check.orgId)
      );
      
      const results = await openFGA.batchCheck(checkParams);
      
      // Convert results to use permission names as keys
      const namedResults = new Map<string, boolean>();
      checks.forEach((check, index) => {
        const key = `${user.id}#${check.permission}@${check.resourceId || check.orgId}`;
        const fgaKey = `${checkParams[index].user}#${checkParams[index].relation}@${checkParams[index].object}`;
        namedResults.set(key, results.get(fgaKey) || false);
      });
      
      return namedResults;
    } catch (err) {
      setError(err as Error);
      return new Map();
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const listUserOrganizations = useCallback(async (): Promise<string[]> => {
    if (!user?.id) return [];

    try {
      setLoading(true);
      setError(null);
      
      const orgs = await openFGA.listObjects(
        formatUser(user.id),
        'member',
        'organization'
      );
      
      // Extract organization IDs from the format "organization:id"
      return orgs.map(org => org.split(':')[1]);
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    check,
    checkRole,
    batchCheck,
    listUserOrganizations,
    loading,
    error,
  };
}

// Hook for permission-based rendering
interface UseCanPerformReturn {
  can: boolean;
  loading: boolean;
}

export function useCanPerform(
  permission: string,
  resourceId?: string,
  orgId?: string
): UseCanPerformReturn {
  const [can, setCan] = useState(false);
  const [loading, setLoading] = useState(true);
  const { check } = useOpenFGA();

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      setLoading(true);
      const result = await check(permission, resourceId, orgId);
      if (mounted) {
        setCan(result);
        setLoading(false);
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [permission, resourceId, orgId, check]);

  return { can, loading };
}

// Hook for role-based rendering
export function useHasRole(role: UserRole, orgId: string): UseCanPerformReturn {
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const { checkRole } = useOpenFGA();

  useEffect(() => {
    let mounted = true;

    const checkUserRole = async () => {
      setLoading(true);
      const result = await checkRole(role, orgId);
      if (mounted) {
        setHasRole(result);
        setLoading(false);
      }
    };

    checkUserRole();

    return () => {
      mounted = false;
    };
  }, [role, orgId, checkRole]);

  return { can: hasRole, loading };
}