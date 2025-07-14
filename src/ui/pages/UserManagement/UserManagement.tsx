import { useState, useCallback } from 'react';
import { 
  PageHeader, 
  UserTable, 
  UserForm, 
  Loading,
  ConfirmationModal,
  UserAvatar,
  CreateUserWorkaround
} from '@components';
import { 
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../../store/api/userManagementApi';
import { User, CreateUserData, UpdateUserData } from '../../typings';
import { useNotification } from '../../hooks/useNotification';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const UserManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [actionTargetUser, setActionTargetUser] = useState<User | null>(null);
  const [showWorkaroundModal, setShowWorkaroundModal] = useState(false);

  const { showSuccess, showError } = useNotification();

  // API hooks
  const { 
    data: usersResponse, 
    isLoading: isLoadingUsers, 
    error: usersError,
    refetch: refetchUsers 
  } = useGetUsersQuery({
    page: 1,
    pageSize: 50,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const { 
    data: selectedUserResponse, 
    isLoading: isLoadingSelectedUser 
  } = useGetUserQuery(selectedUserId!, {
    skip: !selectedUserId || viewMode === 'list' || viewMode === 'create'
  });

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const detailedUser = selectedUserResponse?.data || selectedUser;

  // Handlers
  const handleCreateUser = useCallback(async (userData: CreateUserData) => {
    try {
      await createUser(userData).unwrap();
      showSuccess('User created successfully');
      setViewMode('list');
      refetchUsers();
    } catch (error: any) {
      showError(error?.message || 'Failed to create user');
    }
  }, [createUser, showSuccess, showError, refetchUsers]);

  const handleUpdateUser = useCallback(async (userData: UpdateUserData) => {
    try {
      await updateUser(userData).unwrap();
      showSuccess('User updated successfully');
      setViewMode('list');
      setSelectedUser(null);
      setSelectedUserId(null);
      refetchUsers();
    } catch (error: any) {
      showError(error?.message || 'Failed to update user');
    }
  }, [updateUser, showSuccess, showError, refetchUsers]);

  const handleDeleteUser = useCallback((user: User) => {
    setActionTargetUser(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!actionTargetUser) return;

    try {
      await deleteUser(actionTargetUser.id).unwrap();
      showSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setActionTargetUser(null);
      refetchUsers();
    } catch (error: any) {
      showError(error?.message || 'Failed to delete user');
    }
  }, [actionTargetUser, deleteUser, showSuccess, showError, refetchUsers]);

  const handleDeactivateUser = useCallback((user: User) => {
    setActionTargetUser(user);
    setShowDeactivateModal(true);
  }, []);

  const handleActivateUser = useCallback((user: User) => {
    setActionTargetUser(user);
    setShowDeactivateModal(true);
  }, []);

  const confirmToggleUserStatus = useCallback(async () => {
    if (!actionTargetUser) return;

    const action = actionTargetUser.is_active ? 'deactivate' : 'activate';

    try {
      await updateUser({
        id: actionTargetUser.id,
        is_active: !actionTargetUser.is_active,
      }).unwrap();
      
      showSuccess(`User ${action}d successfully`);
      setShowDeactivateModal(false);
      setActionTargetUser(null);
      refetchUsers();
    } catch (error: any) {
      showError(error?.message || `Failed to ${action} user`);
    }
  }, [actionTargetUser, updateUser, showSuccess, showError, refetchUsers]);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setViewMode('edit');
  }, []);

  const handleViewUser = useCallback((user: User) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setViewMode('view');
  }, []);

  const handleCancelForm = useCallback(() => {
    setViewMode('list');
    setSelectedUser(null);
    setSelectedUserId(null);
  }, []);

  const handleFormSubmit = useCallback((data: any) => {
    if (viewMode === 'create') {
      handleCreateUser(data);
    } else if (viewMode === 'edit' && detailedUser) {
      const { avatar_file, ...updateData } = data;
      handleUpdateUser({
        id: detailedUser.id,
        ...updateData,
        avatar_file: avatar_file,
      });
    }
  }, [viewMode, detailedUser, handleCreateUser, handleUpdateUser]);

  // Loading state
  if (isLoadingUsers && !usersResponse) {
    return <Loading fullScreen={false} />;
  }

  // Error state - show actual error
  if (usersError) {
    console.error('[UserManagement] Error loading users:', usersError);
    
    // Extract error message
    let errorMessage = 'An error occurred while loading users';
    let errorDetails = '';
    
    // Handle different error formats
    const error = usersError as any;
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
      if (error.code) errorDetails = `Code: ${error.code}`;
      if (error.hint) errorDetails += errorDetails ? `, ${error.hint}` : error.hint;
    } else if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.error) {
      errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }
    
    return (
      <div className="container mx-auto px-4">
        <PageHeader name="User Management" />
        <div className="alert alert-error">
          <div>
            <h3 className="font-bold">Error Loading Users</h3>
            <div className="text-sm mt-2">
              {errorMessage}
            </div>
            {errorDetails && (
              <div className="text-xs mt-1 opacity-70">
                {errorDetails}
              </div>
            )}
            <div className="text-xs mt-2 opacity-70">
              Check the console for more details.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const users = usersResponse?.data || [];

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader name="User Management" />
        
        {viewMode === 'list' && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-base-content/70">
              {users.length} users
            </div>
            <button
              onClick={() => setViewMode('create')}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
            {usersError && (
              <button
                onClick={() => setShowWorkaroundModal(true)}
                className="btn btn-secondary btn-outline"
                title="Use alternative method if normal creation fails"
              >
                Workaround
              </button>
            )}
          </div>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <UserTable
          users={users}
          isLoading={isLoadingUsers}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onDeactivateUser={handleDeactivateUser}
          onActivateUser={handleActivateUser}
          onViewUser={handleViewUser}
        />
      )}

      {/* Create/Edit Form */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <UserForm
          user={detailedUser}
          mode={viewMode}
          isLoading={isCreatingUser || isUpdatingUser || isLoadingSelectedUser}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
        />
      )}

      {/* View User Details */}
      {viewMode === 'view' && detailedUser && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-6 max-w-4xl mx-auto text-base-content">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">User Details</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditUser(detailedUser)}
                className="btn btn-primary btn-sm"
              >
                Edit
              </button>
              <button
                onClick={handleCancelForm}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-base-300 pb-2">
                Basic Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <UserAvatar
                    avatarUrl={detailedUser.avatar_url}
                    firstName={detailedUser.first_name}
                    lastName={detailedUser.last_name}
                    email={detailedUser.email}
                    size="xl"
                    className="mb-4"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Name</label>
                  <p className="text-base-content">
                    {detailedUser.first_name} {detailedUser.last_name}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Email</label>
                  <p className="text-base-content">{detailedUser.email}</p>
                </div>
                
                {detailedUser.phone && (
                  <div>
                    <label className="text-sm font-medium text-base-content/70">Phone</label>
                    <p className="text-base-content">{detailedUser.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Role</label>
                  <p>
                    <span className={`badge ${detailedUser.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                      {detailedUser.role}
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Status</label>
                  <p>
                    <span className={`badge ${detailedUser.is_active ? 'badge-success' : 'badge-error'}`}>
                      {detailedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-base-300 pb-2">
                Activity Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-base-content/70">Created</label>
                  <p className="text-base-content">
                    {detailedUser.created_at ? new Date(detailedUser.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Last Updated</label>
                  <p className="text-base-content">
                    {detailedUser.updated_at ? new Date(detailedUser.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Last Login</label>
                  <p className="text-base-content">
                    {detailedUser.last_login_at ? new Date(detailedUser.last_login_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setActionTargetUser(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={actionTargetUser ? 
          `Are you sure you want to delete "${actionTargetUser.first_name} ${actionTargetUser.last_name}"? This action cannot be undone.` :
          'Are you sure you want to delete this user?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeletingUser}
        danger={true}
      />

      {/* Deactivate/Activate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setActionTargetUser(null);
        }}
        onConfirm={confirmToggleUserStatus}
        title={actionTargetUser?.is_active ? "Deactivate User" : "Activate User"}
        message={actionTargetUser ? 
          actionTargetUser.is_active ? 
            `Are you sure you want to deactivate "${actionTargetUser.first_name} ${actionTargetUser.last_name}"?` :
            `Are you sure you want to activate "${actionTargetUser.first_name} ${actionTargetUser.last_name}"?`
          : ''
        }
        confirmText={actionTargetUser?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        isLoading={isUpdatingUser}
        danger={actionTargetUser?.is_active}
      />

      {/* Create User Workaround Modal */}
      <CreateUserWorkaround
        isOpen={showWorkaroundModal}
        onClose={() => setShowWorkaroundModal(false)}
        onSuccess={() => {
          refetchUsers();
          setShowWorkaroundModal(false);
          showSuccess('User created successfully');
        }}
      />
    </div>
  );
};

export default UserManagement;