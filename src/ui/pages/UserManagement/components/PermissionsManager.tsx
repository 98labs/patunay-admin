import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  PageHeader,
  Select,
  Badge,
  Alert,
  Loading,
  EmptyState,
} from '@components';
import {
  useGetUserPermissionsQuery,
  useAssignRoleMutation,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  UserRole,
} from '../../../store/api/userManagementApiV2';
import { useNotification } from '../../../hooks/useNotification';
import { ArrowLeft, Plus, Trash } from 'lucide-react';

interface PermissionsManagerProps {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
  };
  onBack: () => void;
}

const AVAILABLE_PERMISSIONS = [
  // User management
  { value: 'users.create', label: 'Create Users', category: 'User Management' },
  { value: 'users.read', label: 'View Users', category: 'User Management' },
  { value: 'users.update', label: 'Update Users', category: 'User Management' },
  { value: 'users.delete', label: 'Delete Users', category: 'User Management' },

  // Role management
  { value: 'roles.assign', label: 'Assign Roles', category: 'Role Management' },
  { value: 'roles.revoke', label: 'Revoke Roles', category: 'Role Management' },
  { value: 'permissions.grant', label: 'Grant Permissions', category: 'Role Management' },
  { value: 'permissions.revoke', label: 'Revoke Permissions', category: 'Role Management' },

  // Artwork management
  { value: 'artworks.create', label: 'Create Artworks', category: 'Artwork Management' },
  { value: 'artworks.read', label: 'View Artworks', category: 'Artwork Management' },
  { value: 'artworks.update', label: 'Update Artworks', category: 'Artwork Management' },
  { value: 'artworks.delete', label: 'Delete Artworks', category: 'Artwork Management' },
  { value: 'artworks.appraise', label: 'Appraise Artworks', category: 'Artwork Management' },

  // NFC management
  { value: 'nfc.read', label: 'Read NFC Tags', category: 'NFC Management' },
  { value: 'nfc.write', label: 'Write NFC Tags', category: 'NFC Management' },

  // System
  { value: 'system.admin', label: 'System Administration', category: 'System' },
];

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({ user, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedPermission, setSelectedPermission] = useState('');
  const { showSuccess, showError } = useNotification();

  // API hooks
  const {
    data: permissionsData,
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions,
  } = useGetUserPermissionsQuery(user.id);

  const [assignRole, { isLoading: isAssigningRole }] = useAssignRoleMutation();
  const [grantPermission, { isLoading: isGrantingPermission }] = useGrantPermissionMutation();
  const [revokePermission, { isLoading: isRevokingPermission }] = useRevokePermissionMutation();

  const isProcessing = isAssigningRole || isGrantingPermission || isRevokingPermission;

  // Update selected role when user data changes
  useEffect(() => {
    setSelectedRole(user.role);
  }, [user.role]);

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      showError('Please select a different role');
      return;
    }

    try {
      await assignRole({ userId: user.id, role: selectedRole }).unwrap();
      showSuccess('Role assigned successfully');
      refetchPermissions();
    } catch (error: any) {
      showError(error?.message || 'Failed to assign role');
    }
  };

  const handleGrantPermission = async () => {
    if (!selectedPermission) {
      showError('Please select a permission');
      return;
    }

    try {
      await grantPermission({
        userId: user.id,
        permission: selectedPermission,
      }).unwrap();
      showSuccess('Permission granted successfully');
      setSelectedPermission('');
      refetchPermissions();
    } catch (error: any) {
      showError(error?.message || 'Failed to grant permission');
    }
  };

  const handleRevokePermission = async (permission: string) => {
    try {
      await revokePermission({
        userId: user.id,
        permission,
      }).unwrap();
      showSuccess('Permission revoked successfully');
      refetchPermissions();
    } catch (error: any) {
      showError(error?.message || 'Failed to revoke permission');
    }
  };

  const userDisplayName =
    user.first_name || user.last_name
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : user.email;

  // Filter out permissions the user already has
  const availablePermissions = AVAILABLE_PERMISSIONS.filter(
    (p) => !permissionsData?.allPermissions?.includes(p.value)
  );

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, typeof availablePermissions>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Permissions"
        subtitle={`Configure role and permissions for ${userDisplayName}`}
        action={
          <Button onClick={onBack} variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        }
      />

      {/* Role Assignment */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">User Role</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Changing the role will reset permissions to the default for that role
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Select
                label="Select Role"
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as UserRole)}
                options={[
                  { value: 'super_user', label: 'Super User' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'issuer', label: 'Issuer' },
                  { value: 'appraiser', label: 'Appraiser' },
                  { value: 'staff', label: 'Staff' },
                  { value: 'viewer', label: 'Viewer' },
                ]}
              />
            </div>
            <Button
              onClick={handleRoleChange}
              variant="primary"
              disabled={selectedRole === user.role || isProcessing}
              loading={isAssigningRole}
            >
              Update Role
            </Button>
          </div>

          {selectedRole === 'super_user' && (
            <Alert variant="warning" className="mt-4">
              Super User role grants full system access. Use with caution.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Current Permissions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Current Permissions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Permissions granted by role and explicitly assigned
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingPermissions ? (
            <Loading />
          ) : !permissionsData ? (
            <EmptyState title="Unable to load permissions" description="Please try again later" />
          ) : (
            <div className="space-y-6">
              {/* Default Role Permissions */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default permissions for {permissionsData.role} role:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {permissionsData.defaultPermissions?.map((permission) => (
                    <Badge key={permission} variant="secondary">
                      {permission}
                    </Badge>
                  )) || <span className="text-sm text-gray-500">No default permissions</span>}
                </div>
              </div>

              {/* Explicit Permissions */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional permissions:
                </h4>
                <div className="space-y-2">
                  {permissionsData.explicitPermissions?.length > 0 ? (
                    permissionsData.explicitPermissions.map((perm: any) => (
                      <div
                        key={perm.permission}
                        className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-700"
                      >
                        <Badge variant="primary">{perm.permission}</Badge>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRevokePermission(perm.permission)}
                          disabled={isProcessing}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No additional permissions granted</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant New Permission */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Grant Additional Permission</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Grant specific permissions beyond the default role permissions
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Select
                label="Select Permission"
                value={selectedPermission}
                onChange={setSelectedPermission}
                options={[
                  { value: '', label: 'Choose a permission...' },
                  ...Object.entries(groupedPermissions).flatMap(([category, perms]) => [
                    { value: `category-${category}`, label: category, disabled: true },
                    ...perms.map((p) => ({
                      value: p.value,
                      label: `  ${p.label}`,
                    })),
                  ]),
                ]}
              />
            </div>
            <Button
              onClick={handleGrantPermission}
              variant="primary"
              disabled={!selectedPermission || isProcessing}
              loading={isGrantingPermission}
            >
              <Plus className="mr-2 h-4 w-4" />
              Grant Permission
            </Button>
          </div>

          {availablePermissions.length === 0 && (
            <Alert variant="info" className="mt-4">
              This user already has all available permissions.
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
