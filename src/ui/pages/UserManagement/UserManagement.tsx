import { useState, useCallback, useMemo } from 'react';
import {
  PageHeader,
  Loading,
  ConfirmationModal,
  Button,
  SearchInput,
  Select,
  Badge,
  EmptyState,
} from '@components';
import { DataTable } from '../../components/DataTable';
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useDisableUserMutation,
  useEnableUserMutation,
} from '../../store/api/userManagementApiV2';
import { UserRole } from '../../store/api/userManagementApiV2';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import { UserForm } from './components/UserForm';
import { PermissionsManager } from './components/PermissionsManager';
import { UserActionsMenu } from './components/UserActionsMenu';
import { Plus, Users } from 'lucide-react';
import {
  createColumnHelper,
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

type ViewMode = 'list' | 'create' | 'edit' | 'permissions';

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  permissions?: string[];
}

type SelectedUser = UserData;

const UserManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // DataTable state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Legacy filter states for backward compatibility
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { showSuccess, showError } = useNotification();
  const { user: currentUser } = useAuth();

  // API hooks
  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useGetUsersQuery({
    page: pagination.pageIndex + 1, // API expects 1-based pagination
    pageSize: pagination.pageSize,
    filters: {
      role: roleFilter !== 'all' ? roleFilter : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      search: globalFilter || undefined,
    },
    sortBy: sorting.length > 0 ? sorting[0].id : 'created_at',
    sortOrder: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
  });

  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();
  const [disableUser, { isLoading: isDisablingUser }] = useDisableUserMutation();
  const [enableUser, { isLoading: isEnablingUser }] = useEnableUserMutation();

  const isProcessing = isDeletingUser || isDisablingUser || isEnablingUser;

  // Handlers
  const handleCreateUser = useCallback(() => {
    setSelectedUser(null);
    setViewMode('create');
  }, []);

  const handleEditUser = useCallback((user: SelectedUser) => {
    setSelectedUser(user);
    setViewMode('edit');
  }, []);

  const handleManagePermissions = useCallback((user: SelectedUser) => {
    setSelectedUser(user);
    setViewMode('permissions');
  }, []);

  const handleDeleteUser = useCallback(
    (user: SelectedUser) => {
      setSelectedUser(user);
      // Only super_user can actually delete, admin users get a different modal
      if (currentUser?.role === 'super_user') {
        setShowDeleteModal(true);
      } else {
        // For admin users, show a message about contacting support
        showError('Contact Patunay support to delete a user. You can disable the account instead.');
      }
    },
    [currentUser?.role, showError]
  );

  const handleToggleUserStatus = useCallback((user: SelectedUser) => {
    setSelectedUser(user);
    setShowStatusModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id).unwrap();
      showSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error: unknown) {
      showError((error as Error)?.message || 'Failed to delete user');
    }
  }, [selectedUser, deleteUser, showSuccess, showError, refetchUsers]);

  const confirmToggleUserStatus = useCallback(async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.is_active) {
        await disableUser(selectedUser.id).unwrap();
        showSuccess('User disabled successfully');
      } else {
        await enableUser(selectedUser.id).unwrap();
        showSuccess('User enabled successfully');
      }
      setShowStatusModal(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error: unknown) {
      showError((error as Error)?.message || 'Failed to update user status');
    }
  }, [selectedUser, disableUser, enableUser, showSuccess, showError, refetchUsers]);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedUser(null);
    refetchUsers();
  }, [refetchUsers]);

  // Column helper for type safety
  const columnHelper = createColumnHelper<UserData>();

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (row) => ({
          name:
            row.first_name || row.last_name
              ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
              : 'No name',
          email: row.email,
          avatar_url: row.avatar_url,
          first_name: row.first_name,
        }),
        {
          id: 'user',
          header: 'User',
          cell: (info) => {
            const data = info.getValue();
            return (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {data.avatar_url ? (
                    <img className="h-10 w-10 rounded-full" src={data.avatar_url} alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {data.first_name?.[0]?.toUpperCase() || data.email[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-neutral-black-01)' }}
                  >
                    {data.name}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}
                  >
                    {data.email}
                  </div>
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => {
          const role = info.getValue();
          const isAdminRole = role === 'admin' || role === 'super_user';
          return (
            <Badge
              className={`rounded-lg ${
                isAdminRole
                  ? 'bg-[var(--color-primary-500)] text-[var(--color-neutral-white)]'
                  : 'bg-[var(--color-neutral-gray-01)] text-[var(--color-neutral-black-01)]'
              }`}
            >
              {role}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: (info) => {
          const isActive = info.getValue();
          return (
            <Badge
              className={`rounded-lg ${
                isActive
                  ? 'bg-[var(--color-semantic-success)] text-[var(--color-neutral-white)]'
                  : 'bg-[var(--color-semantic-error)] text-[var(--color-neutral-white)]'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('last_sign_in_at', {
        header: 'Last Login',
        cell: (info) => (
          <span
            className="text-sm"
            style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}
          >
            {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : 'Never'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <UserActionsMenu
            user={info.row.original}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            onEdit={() => handleEditUser(info.row.original)}
            onManagePermissions={() => handleManagePermissions(info.row.original)}
            onToggleStatus={() => handleToggleUserStatus(info.row.original)}
            onDelete={() => handleDeleteUser(info.row.original)}
          />
        ),
      }),
    ],
    [
      columnHelper,
      currentUser?.id,
      currentUser?.role,
      handleEditUser,
      handleManagePermissions,
      handleToggleUserStatus,
      handleDeleteUser,
    ]
  );

  // Render different views
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <UserForm
        user={selectedUser}
        mode={viewMode === 'create' ? 'create' : 'edit'}
        onSuccess={handleBackToList}
        onCancel={handleBackToList}
      />
    );
  }

  if (viewMode === 'permissions' && selectedUser) {
    return <PermissionsManager user={selectedUser} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage users, roles, and permissions"
        action={
          currentUser?.role === 'admin' || currentUser?.role === 'super_user' ? (
            <Button onClick={handleCreateUser} variant="primary">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          ) : null
        }
      />

      {/* Filters and Actions */}
      <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <SearchInput
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Search users..."
            className="md:col-span-2"
          />
          <Select
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as UserRole | 'all')}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'super_user', label: 'Super User' },
              { value: 'admin', label: 'Admin' },
              { value: 'issuer', label: 'Issuer' },
              { value: 'appraiser', label: 'Appraiser' },
              { value: 'staff', label: 'Staff' },
              { value: 'viewer', label: 'Viewer' },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoadingUsers || usersError || !usersResponse?.data || usersResponse.data.length === 0 ? (
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          {isLoadingUsers ? (
            <div className="p-8">
              <Loading />
            </div>
          ) : usersError ? (
            <div className="p-8">
              <EmptyState
                title="Error loading users"
                description={usersError.toString()}
                action={{
                  label: 'Retry',
                  onClick: () => refetchUsers(),
                }}
              />
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No users found"
                description={
                  globalFilter || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'No users match your filters. Try adjusting your search criteria.'
                    : 'Get started by creating your first user.'
                }
                action={
                  globalFilter || roleFilter !== 'all' || statusFilter !== 'all'
                    ? {
                        label: 'Clear filters',
                        onClick: () => {
                          setGlobalFilter('');
                          setRoleFilter('all');
                          setStatusFilter('all');
                        },
                      }
                    : currentUser?.role === 'admin' || currentUser?.role === 'super_user'
                      ? {
                          label: 'Add User',
                          onClick: handleCreateUser,
                        }
                      : undefined
                }
              />
            </div>
          )}
        </div>
      ) : (
        <DataTable
          data={usersResponse.data}
          columns={columns}
          isLoading={isLoadingUsers}
          totalCount={usersResponse.count}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          manualPagination={true}
          manualSorting={true}
          manualFiltering={true}
          centerAlignColumns={['role', 'is_active', 'actions']}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.email}? This action cannot be undone.`}
        confirmText="Delete"
        danger={true}
        isLoading={isProcessing}
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={confirmToggleUserStatus}
        title={selectedUser?.is_active ? 'Disable User' : 'Enable User'}
        message={`Are you sure you want to ${selectedUser?.is_active ? 'disable' : 'enable'} ${selectedUser?.email}?`}
        confirmText={selectedUser?.is_active ? 'Disable' : 'Enable'}
        danger={selectedUser?.is_active}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default UserManagement;
