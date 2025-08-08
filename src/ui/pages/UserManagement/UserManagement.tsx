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
  Pagination,
} from '@components';
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
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
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

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
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
    page: currentPage,
    pageSize,
    filters: {
      role: roleFilter !== 'all' ? roleFilter : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      search: searchQuery || undefined,
    },
    sortBy: 'created_at',
    sortOrder: 'desc',
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

  const handleDeleteUser = useCallback((user: SelectedUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }, []);

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
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{data.email}</div>
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => (
          <Badge
            variant={
              info.getValue() === 'admin' || info.getValue() === 'super_user'
                ? 'primary'
                : 'secondary'
            }
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'success' : 'danger'}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </Badge>
        ),
      }),
      columnHelper.accessor('last_sign_in_at', {
        header: 'Last Login',
        cell: (info) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
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
      handleEditUser,
      handleManagePermissions,
      handleToggleUserStatus,
      handleDeleteUser,
    ]
  );

  // Create table instance
  const table = useReactTable({
    data: usersResponse?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
            value={searchQuery}
            onChange={setSearchQuery}
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
        ) : !usersResponse?.data || usersResponse.data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No users found"
              description={
                searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No users match your filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first user.'
              }
              action={
                searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                  ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setSearchQuery('');
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
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersResponse.count > pageSize && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(usersResponse.count / pageSize)}
                  onPageChange={setCurrentPage}
                  totalItems={usersResponse.count}
                  itemsPerPage={pageSize}
                />
              </div>
            )}
          </>
        )}
      </div>

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
