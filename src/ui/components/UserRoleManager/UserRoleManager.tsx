/**
 * Component for managing user roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { useAuthzManagement } from '../../hooks/useAuthz';
import { authzService } from '../../services/authz';
import { showNotification } from '../NotificationMessage/slice';
import { useDispatch } from 'react-redux';
import type { User } from '@supabase/supabase-js';

interface UserRoleManagerProps {
  user: User;
  onUpdate?: () => void;
  className?: string;
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  user,
  onUpdate,
  className = ''
}) => {
  const dispatch = useDispatch();
  const { addUserToGroup, removeUserFromGroup, isLoading } = useAuthzManagement();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingRoles, setCheckingRoles] = useState(true);

  // Check current roles
  useEffect(() => {
    const checkRoles = async () => {
      try {
        const [adminCheck, staffCheck] = await Promise.all([
          authzService.isUserInGroup(user.id, 'admins'),
          authzService.isUserInGroup(user.id, 'staff')
        ]);
        setIsAdmin(adminCheck);
        setIsStaff(staffCheck);
      } catch (error) {
        console.error('Failed to check user roles:', error);
      } finally {
        setCheckingRoles(false);
      }
    };

    checkRoles();
  }, [user.id]);

  const handleRoleChange = async (role: 'admin' | 'staff', checked: boolean) => {
    try {
      if (role === 'admin') {
        if (checked) {
          await addUserToGroup(user.id, 'admins');
          // Admins should also be in staff group
          await addUserToGroup(user.id, 'staff');
          setIsAdmin(true);
          setIsStaff(true);
        } else {
          await removeUserFromGroup(user.id, 'admins');
          setIsAdmin(false);
        }
      } else if (role === 'staff') {
        if (checked) {
          await addUserToGroup(user.id, 'staff');
          setIsStaff(true);
        } else {
          // Can't remove from staff if admin
          if (isAdmin) {
            dispatch(showNotification({
              message: 'Cannot remove staff role from admin users',
              status: 'warning'
            }));
            return;
          }
          await removeUserFromGroup(user.id, 'staff');
          setIsStaff(false);
        }
      }

      dispatch(showNotification({
        message: `User role updated successfully`,
        status: 'success'
      }));

      onUpdate?.();
    } catch (error) {
      console.error('Failed to update user role:', error);
      dispatch(showNotification({
        message: `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }));
    }
  };

  if (checkingRoles) {
    return (
      <div className={`${className}`}>
        <div className="loading loading-spinner loading-sm"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-base-content">User Roles</h4>
      
      <div className="space-y-2">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={isAdmin}
            onChange={(e) => handleRoleChange('admin', e.target.checked)}
            disabled={isLoading}
          />
          <span className="text-sm">
            Administrator
            <span className="text-xs text-base-content/70 ml-1">
              (Full system access)
            </span>
          </span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={isStaff}
            onChange={(e) => handleRoleChange('staff', e.target.checked)}
            disabled={isLoading || isAdmin}
          />
          <span className="text-sm">
            Staff
            <span className="text-xs text-base-content/70 ml-1">
              (Artwork and statistics access)
            </span>
          </span>
        </label>
      </div>

      {isLoading && (
        <div className="text-sm text-base-content/70">
          Updating roles...
        </div>
      )}
    </div>
  );
};

/**
 * Component for managing specific permissions
 */
interface PermissionManagerProps {
  user: User;
  onUpdate?: () => void;
  className?: string;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  user,
  onUpdate,
  className = ''
}) => {
  const dispatch = useDispatch();
  const { grant, revoke, isLoading } = useAuthzManagement();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    user_manager: false,
    artwork_editor: false,
    nfc_manager: false,
    statistics_viewer: false,
    appraisal_editor: false
  });
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Check current permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const checks = await authzService.batchCheck([
          { namespace: 'system', objectId: 'global', relation: 'user_manager', subjectNamespace: 'user', subjectId: user.id },
          { namespace: 'artwork', objectId: '*', relation: 'editor', subjectNamespace: 'user', subjectId: user.id },
          { namespace: 'nfc_tag', objectId: '*', relation: 'manager', subjectNamespace: 'user', subjectId: user.id },
          { namespace: 'system', objectId: 'global', relation: 'statistics_viewer', subjectNamespace: 'user', subjectId: user.id },
          { namespace: 'appraisal', objectId: '*', relation: 'editor', subjectNamespace: 'user', subjectId: user.id }
        ]);

        setPermissions({
          user_manager: checks[0],
          artwork_editor: checks[1],
          nfc_manager: checks[2],
          statistics_viewer: checks[3],
          appraisal_editor: checks[4]
        });
      } catch (error) {
        console.error('Failed to check permissions:', error);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, [user.id]);

  const handlePermissionChange = async (permission: string, checked: boolean) => {
    const permissionMap: Record<string, { namespace: any; objectId: string; relation: string }> = {
      user_manager: { namespace: 'system', objectId: 'global', relation: 'user_manager' },
      artwork_editor: { namespace: 'artwork', objectId: '*', relation: 'editor' },
      nfc_manager: { namespace: 'nfc_tag', objectId: '*', relation: 'manager' },
      statistics_viewer: { namespace: 'system', objectId: 'global', relation: 'statistics_viewer' },
      appraisal_editor: { namespace: 'appraisal', objectId: '*', relation: 'editor' }
    };

    const perm = permissionMap[permission];
    if (!perm) return;

    try {
      if (checked) {
        await grant(perm.namespace, perm.objectId, perm.relation, 'user', user.id);
      } else {
        await revoke(perm.namespace, perm.objectId, perm.relation, 'user', user.id);
      }

      setPermissions(prev => ({ ...prev, [permission]: checked }));

      dispatch(showNotification({
        message: `Permission updated successfully`,
        status: 'success'
      }));

      onUpdate?.();
    } catch (error) {
      console.error('Failed to update permission:', error);
      dispatch(showNotification({
        message: `Failed to update permission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }));
    }
  };

  if (checkingPermissions) {
    return (
      <div className={`${className}`}>
        <div className="loading loading-spinner loading-sm"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-base-content">Individual Permissions</h4>
      
      <div className="space-y-2">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={permissions.user_manager}
            onChange={(e) => handlePermissionChange('user_manager', e.target.checked)}
            disabled={isLoading}
          />
          <span className="text-sm">Manage Users</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={permissions.artwork_editor}
            onChange={(e) => handlePermissionChange('artwork_editor', e.target.checked)}
            disabled={isLoading}
          />
          <span className="text-sm">Edit Artworks</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={permissions.nfc_manager}
            onChange={(e) => handlePermissionChange('nfc_manager', e.target.checked)}
            disabled={isLoading}
          />
          <span className="text-sm">Manage NFC Tags</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={permissions.statistics_viewer}
            onChange={(e) => handlePermissionChange('statistics_viewer', e.target.checked)}
            disabled={isLoading}
          />
          <span className="text-sm">View Statistics</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={permissions.appraisal_editor}
            onChange={(e) => handlePermissionChange('appraisal_editor', e.target.checked)}
            disabled={isLoading}
          />
          <span className="text-sm">Edit Appraisals</span>
        </label>
      </div>

      {isLoading && (
        <div className="text-sm text-base-content/70">
          Updating permissions...
        </div>
      )}
    </div>
  );
};