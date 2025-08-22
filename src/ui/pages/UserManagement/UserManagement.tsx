import { useState, useCallback, useMemo, useRef } from 'react';
import {
  PageHeader,
  Loading,
  ConfirmationModal,
  Button,
  FormField,
  Select,
  Badge,
  EmptyState,
  SideDrawer,
  StatusIndicator,
} from '@components';
import { DataTable } from '../../components/DataTable';
import { classNames } from '../../utils/classNames';

import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useDisableUserMutation,
  useEnableUserMutation,
  useUpdateUserMutation,
} from '../../store/api/userManagementApiV2';
import { UserRole } from '../../store/api/userManagementApiV2';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import { UserForm } from './components/UserForm';
import { PermissionsManager } from './components/PermissionsManager';
import { Edit, Pencil, Plus, Search, Users } from 'lucide-react';
import {
  createColumnHelper,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  Row,
} from '@tanstack/react-table';
import { ActionBox } from '@components';

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
  phone?: string;
  last_login_at?: string;
  updated_at?: string;
  created_at?: string;
}

type SelectedUser = UserData;

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const UserManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: '' as UserRole,
    avatar_url: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();

  const isProcessing = isDeletingUser || isDisablingUser || isEnablingUser;

  const [isDrawerEnabled, setIsDrawerEnabled] = useState(false);

  // Handlers
  const handleCreateUser = useCallback(() => {
    setSelectedUser(null);
    setViewMode('create');
  }, []);

  const handleManagePermissions = useCallback((user: SelectedUser) => {
    setSelectedUser(user);
    setViewMode('permissions');
  }, []);

  const handleSetIsDrawerOpened = useCallback((row: Row<UserData>) => {
    setSelectedUser(row.original);
    setIsDrawerEnabled(true);
    setIsEditMode(false);
  }, []);

  const handleCloseDrawer = () => {
    setIsDrawerEnabled(false);
    setIsEditMode(false);
  };

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
        setSelectedUser({ ...selectedUser, is_active: false });
      } else {
        await enableUser(selectedUser.id).unwrap();
        showSuccess('User enabled successfully');
        setSelectedUser({ ...selectedUser, is_active: true });
      }
      setShowStatusModal(false);
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

  const handleStartEdit = useCallback(() => {
    if (selectedUser) {
      setEditFormData({
        first_name: selectedUser.first_name || '',
        last_name: selectedUser.last_name || '',
        phone: selectedUser.phone || '',
        role: selectedUser.role,
        avatar_url: selectedUser.avatar_url || '',
      });
      setAvatarPreview(selectedUser.avatar_url || null);
      setAvatarFile(null);
      setIsEditMode(true);
    }
  }, [selectedUser]);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        id: selectedUser.id,
        ...editFormData,
      };

      if (avatarFile) {
        updateData.avatar_file = avatarFile;
      }

      await updateUser(updateData).unwrap();

      showSuccess('User updated successfully');
      setSelectedUser({
        ...selectedUser,
        ...editFormData,
        avatar_url: avatarPreview || editFormData.avatar_url,
      });
      setIsEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      refetchUsers();
    } catch (error: unknown) {
      showError((error as Error)?.message || 'Failed to update user');
    }
  }, [
    selectedUser,
    editFormData,
    avatarFile,
    avatarPreview,
    updateUser,
    showSuccess,
    showError,
    refetchUsers,
  ]);

  const handleAvatarFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          showError('Please select an image file.');
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          showError('File size must be less than 5MB.');
          return;
        }

        setAvatarFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [showError]
  );

  const handleAvatarClick = useCallback(() => {
    if (isEditMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isEditMode]);

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
    ],
    [columnHelper, currentUser?.id, currentUser?.role]
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
              <div className="flex items-center gap-1">
                <Plus size={20} /> <span className="">Add New User</span>
              </div>
            </Button>
          ) : null
        }
      />

      {/* Filters and Actions */}
      <div className="flex gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="flex-1">
            <FormField
              isLabelVisible={false}
              className="py-2"
              prefixIcon={Search}
              placeholder="Search users by name, email, or role..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
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
          onRowClick={handleSetIsDrawerOpened}
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

      <SideDrawer
        headerTitle="User Details"
        width={480}
        isDrawerOpen={isDrawerEnabled}
        onClose={handleCloseDrawer}
      >
        <div className="h-full p-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`group relative ${isEditMode ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
              >
                {(isEditMode && avatarPreview) || (!isEditMode && selectedUser?.avatar_url) ? (
                  <img
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-neutral-gray-02)]"
                    src={isEditMode ? avatarPreview! : selectedUser!.avatar_url}
                    alt=""
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-neutral-gray-03)] text-2xl font-semibold text-[var(--color-neutral-black-02)] ring-2 ring-[var(--color-neutral-gray-02)]">
                    {selectedUser?.first_name?.[0]?.toUpperCase() ||
                      selectedUser?.email?.[0]?.toUpperCase() ||
                      '?'}
                  </div>
                )}
                {isEditMode && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-black opacity-0 transition-opacity group-hover:opacity-30" />
                    <div className="absolute right-0 bottom-0 rounded-full border border-gray-200 bg-white p-1 shadow-md dark:border-gray-600 dark:bg-gray-700">
                      <Pencil className="h-3 w-3" />
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarFileChange}
              />
              {isEditMode && avatarFile && (
                <span className="mt-2 text-xs text-[var(--color-semantic-success)]">
                  ✓ New image selected
                </span>
              )}
              {isEditMode ? (
                <div className="pt-4">
                  <div className="flex gap-2">
                    <FormField
                      label="First Name"
                      placeholder="First Name"
                      value={editFormData.first_name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, first_name: e.target.value })
                      }
                      className="py-2"
                    />
                    <FormField
                      label="Last Name"
                      placeholder="Last Name"
                      value={editFormData.last_name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, last_name: e.target.value })
                      }
                      className="py-2"
                    />
                  </div>
                  <FormField
                    label="Phone Number"
                    placeholder="Phone Number"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="py-2"
                  />
                </div>
              ) : (
                <>
                  <span className="text-xl font-semibold">
                    {selectedUser?.first_name} {selectedUser?.last_name}
                  </span>
                  <span className="text-xs text-[var(--color-neutral-black-02)]">
                    {selectedUser?.email}
                  </span>
                  <span className="text-xs text-[var(--color-neutral-black-02)] italic">
                    {selectedUser?.phone || 'No phone number'}
                  </span>
                </>
              )}
            </div>

            <div className="flex h-full flex-col gap-2 text-sm">
              {/* Role and Status */}
              <div className="flex">
                <div className="flex-1">
                  <h3 className="font-semibold">Role</h3>
                  {isEditMode ? (
                    <Select
                      value={editFormData.role}
                      onChange={(value) =>
                        setEditFormData({ ...editFormData, role: value as UserRole })
                      }
                      options={[
                        { value: 'super_user', label: 'Super User' },
                        { value: 'admin', label: 'Admin' },
                        { value: 'issuer', label: 'Issuer' },
                        { value: 'appraiser', label: 'Appraiser' },
                        { value: 'staff', label: 'Staff' },
                        { value: 'viewer', label: 'Viewer' },
                      ]}
                    />
                  ) : (
                    <p className="">{selectedUser?.role}</p>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Status</h3>
                  <StatusIndicator isActive={selectedUser?.is_active || false} />
                </div>
              </div>
              {/* Permissions */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold">Permissions</h3>
                <ul className="flex flex-wrap gap-1">
                  {selectedUser?.permissions?.map((permission) => (
                    <li
                      key={permission}
                      className="rounded-full bg-[var(--color-neutral-gray-02)] px-2"
                    >
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Metadata */}
              <div className="flex flex-col gap-2 pt-4 pb-4 border-b">
                <div>
                  <h3 className="font-semibold">User ID</h3>
                  <span>{selectedUser?.id}</span>
                </div>
                <div>
                  <h3 className="font-semibold">Last Edited At</h3>
                  <span>{formatDate(selectedUser?.updated_at)}</span>
                </div>
                <div>
                  <h3 className="font-semibold">Last Logged In</h3>
                  <span>
                    {formatDate(selectedUser?.last_login_at || selectedUser?.last_sign_in_at)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">Account Created At</h3>
                  <span>{formatDate(selectedUser?.created_at)}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4">
                {isEditMode ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      variant="primary"
                      loading={isUpdatingUser}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button onClick={handleCancelEdit} variant="secondary" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <ActionBox
                    title="Edit User"
                    description="Make changes to the user's profile"
                    buttonText="Edit User"
                    onButtonClick={handleStartEdit}
                    borderColorClass="border-[var(--color-accent-yellow-400)]/50"
                    boxBgClass="bg-[var(--color-accent-yellow-200)]/50"
                    buttonBgClass="bg-[var(--color-accent-yellow-400)]/30"
                    buttonHoverBgClass="hover:bg-[var(--color-accent-yellow-400)]/60"
                    textColor="text-[var(--color-accent-yellow-600)]"
                  />
                )}
                {!isEditMode && (
                  <>
                    <ActionBox
                      title="Manage User Roles and Permissions"
                      description="Make changes to the user's roles and permissions"
                      buttonText="Manage Permissions"
                      onButtonClick={() => {
                        selectedUser && handleManagePermissions(selectedUser);
                        setIsDrawerEnabled(false);
                      }}
                    />
                    <ActionBox
                      title={selectedUser?.is_active ? 'Disable User' : 'Enable User'}
                      description={
                        selectedUser?.is_active
                          ? "Deactivate user's account"
                          : "Activate user's account"
                      }
                      buttonText={selectedUser?.is_active ? 'Disable User' : 'Enable User'}
                      borderColorClass={
                        selectedUser?.is_active
                          ? 'border-[var(--color-tertiary-red-400)]/50'
                          : 'border-[var(--color-tertiary-green-400)]/50'
                      }
                      boxBgClass={
                        selectedUser?.is_active
                          ? 'bg-[var(--color-tertiary-red-200)]/50'
                          : 'bg-[var(--color-tertiary-green-200)]/20'
                      }
                      buttonBgClass={
                        selectedUser?.is_active
                          ? 'bg-[var(--color-tertiary-red-400)]/30'
                          : 'bg-[var(--color-tertiary-green-400)]/30'
                      }
                      buttonHoverBgClass={
                        selectedUser?.is_active
                          ? 'hover:bg-[var(--color-tertiary-red-400)]/60'
                          : 'hover:bg-[var(--color-tertiary-green-400)]/60'
                      }
                      textColor={
                        selectedUser?.is_active
                          ? 'text-[var(--color-tertiary-red-600)]'
                          : 'text-[var(--color-tertiary-green-600)]'
                      }
                      onButtonClick={() => selectedUser && handleToggleUserStatus(selectedUser)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SideDrawer>
    </div>
  );
};

export default UserManagement;
