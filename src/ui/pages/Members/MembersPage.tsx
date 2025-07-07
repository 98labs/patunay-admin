import React, { useState, useCallback, useMemo } from 'react';
import { 
  PageHeader, 
  Loading,
  UserAvatar,
  InviteMemberModal,
  EditMemberModal,
  DeleteConfirmationModal,
  FormField
} from '@components';
import { 
  useGetOrganizationUsersQuery,
  useCreateUserMutation,
  useUpdateOrganizationMembershipMutation,
  useRemoveUserFromOrganizationMutation,
  useAddUserToOrganizationMutation
} from '../../store/api/multiTenantUserApi';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useNotification } from '../../hooks/useNotification';
import { format } from 'date-fns';
import { UserRole, DEFAULT_PERMISSIONS } from '../../typings';

interface MemberFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  permissions: string[];
  phone?: string;
}

const MembersPage: React.FC = () => {
  const { currentOrganization } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const {
    canManageOrgUsers,
    canViewUsers,
  } = usePermissions();

  const organizationId = currentOrganization?.id || '';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState<MemberFormData>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    permissions: [],
    phone: '',
  });

  // Queries
  const { 
    data: membersResponse, 
    isLoading,
    refetch 
  } = useGetOrganizationUsersQuery({
    organization_id: organizationId,
    page: 1,
    pageSize: 100, // Get all members for now
  }, {
    skip: !organizationId || !canViewUsers
  });

  // Mutations
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [addUserToOrg, { isLoading: isAddingToOrg }] = useAddUserToOrganizationMutation();
  const [updateMembership, { isLoading: isUpdating }] = useUpdateOrganizationMembershipMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveUserFromOrganizationMutation();

  // Filter members
  const filteredMembers = useMemo(() => {
    let members = membersResponse?.users || [];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      members = members.filter(member => 
        member.email?.toLowerCase().includes(search) ||
        member.first_name?.toLowerCase().includes(search) ||
        member.last_name?.toLowerCase().includes(search) ||
        member.phone?.toLowerCase().includes(search)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      members = members.filter(member => 
        member.organizations?.[0]?.role === roleFilter
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      members = members.filter(member => 
        member.organizations?.[0]?.is_active === isActive
      );
    }

    return members;
  }, [membersResponse?.users, searchTerm, roleFilter, statusFilter]);

  // Handlers
  const handleInviteMember = async (data: typeof inviteForm) => {
    try {
      // Generate a temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
      
      const result = await createUser({
        userData: {
          ...data,
          password: tempPassword,
          organization_id: organizationId,
        },
        organizationId
      }).unwrap();

      showSuccess('Member invited successfully. They will receive an email to set their password.');
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        first_name: '',
        last_name: '',
        role: 'viewer',
        permissions: [],
        phone: '',
      });
      refetch();
    } catch (error: any) {
      showError(error?.message || 'Failed to invite member');
    }
  };

  const handleUpdateMember = async (role: UserRole) => {
    if (!selectedMember) return;

    try {
      await updateMembership({
        membership_id: selectedMember.organizations[0].id,
        user_id: selectedMember.id,
        organization_id: organizationId,
        role: role,
        permissions: selectedMember.organizations[0].permissions,
      }).unwrap();

      showSuccess('Member updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      refetch();
    } catch (error: any) {
      showError(error?.message || 'Failed to update member');
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      await removeMember({
        user_id: selectedMember.id,
        organization_id: organizationId,
      }).unwrap();

      showSuccess('Member removed successfully');
      setShowRemoveModal(false);
      setSelectedMember(null);
      refetch();
    } catch (error: any) {
      showError(error?.message || 'Failed to remove member');
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'super_user':
        return 'badge-error';
      case 'admin':
        return 'badge-primary';
      case 'issuer':
        return 'badge-secondary';
      case 'appraiser':
        return 'badge-info';
      case 'staff':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  };

  if (!organizationId) {
    return (
      <div className="container mx-auto px-4">
        <div className="alert alert-warning">
          <span>No organization selected. Please select an organization first.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <PageHeader 
        title="Organization Members"
        subtitle={`Manage members of ${currentOrganization?.name}`}
        action={
          canManageOrgUsers && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite Member
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                className="select select-bordered w-full"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="issuer">Issuer</option>
                <option value="appraiser">Appraiser</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="select select-bordered w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-base-content/60 mt-2">
            Showing {filteredMembers.length} of {membersResponse?.users.length || 0} members
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const membership = member.organizations?.[0];
          return (
            <div key={member.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      user={{
                        first_name: member.first_name,
                        last_name: member.last_name,
                        avatar_url: member.avatar_url
                      }}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold">
                        {member.first_name} {member.last_name}
                      </h3>
                      <p className="text-sm text-base-content/60">{member.email}</p>
                      {member.phone && (
                        <p className="text-xs text-base-content/50">{member.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  {canManageOrgUsers && (
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </label>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a onClick={() => {
                            setSelectedMember({
                              ...member,
                              organizations: [{
                                ...membership,
                                role: membership?.role || 'viewer',
                                permissions: membership?.permissions || []
                              }]
                            });
                            setShowEditModal(true);
                          }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Role
                          </a>
                        </li>
                        <li>
                          <a 
                            className="text-error"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRemoveModal(true);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                            </svg>
                            Remove
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/60">Role</span>
                    <span className={`badge ${getRoleBadgeClass(membership?.role || 'viewer')} badge-sm`}>
                      {membership?.role || 'viewer'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/60">Status</span>
                    <span className={`badge ${membership?.is_active ? 'badge-success' : 'badge-error'} badge-sm`}>
                      {membership?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {membership?.joined_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/60">Joined</span>
                      <span className="text-sm">
                        {format(new Date(membership.joined_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {membership?.permissions && membership.permissions.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-base-content/60 mb-1">Custom Permissions</p>
                      <div className="flex flex-wrap gap-1">
                        {membership.permissions.slice(0, 3).map((perm, idx) => (
                          <span key={idx} className="badge badge-xs">{perm}</span>
                        ))}
                        {membership.permissions.length > 3 && (
                          <span className="badge badge-xs">+{membership.permissions.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-base-content/60">No members found</p>
          {canManageOrgUsers && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="btn btn-primary btn-sm mt-4"
            >
              Invite First Member
            </button>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteForm({
            email: '',
            first_name: '',
            last_name: '',
            role: 'viewer',
            permissions: [],
            phone: '',
          });
        }}
        onSubmit={handleInviteMember}
        isLoading={isCreating}
        initialData={inviteForm}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        onSubmit={handleUpdateMember}
        member={selectedMember ? {
          id: selectedMember.id,
          first_name: selectedMember.first_name || '',
          last_name: selectedMember.last_name || '',
          email: selectedMember.email,
          role: selectedMember.organizations[0].role
        } : null}
        defaultPermissions={DEFAULT_PERMISSIONS}
        isLoading={isUpdating}
      />

      {/* Remove Member Confirmation */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setSelectedMember(null);
        }}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={selectedMember ? 
          `Are you sure you want to remove ${selectedMember.first_name} ${selectedMember.last_name} from this organization? They will lose access to all organization data.` :
          'Are you sure you want to remove this member?'
        }
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={isRemoving}
        danger={true}
      />
    </div>
  );
};

export default MembersPage;