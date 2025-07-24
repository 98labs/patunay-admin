import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  PageHeader, 
  Loading, 
  StatsCard,
  UserAvatar,
  PermissionGuard,
  ConfirmationModal
} from '@components';
import { 
  useGetOrganizationQuery, 
  useGetOrganizationStatsQuery,
  useGetOrganizationMembersQuery,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation
} from '../../store/api/organizationApi';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useNotification } from '../../hooks/useNotification';
import { format } from 'date-fns';
import { OrganizationType, UserRole } from '../../typings';

const OrganizationPage: React.FC = () => {
  const { currentOrganization, isSuperUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const {
    canManageOrgSettings,
    canManageOrgUsers,
    canViewOrgStatistics,
    canManageOrganizations,
  } = usePermissions();

  const organizationId = currentOrganization?.id || '';

  // State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    type: '' as OrganizationType,
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
  });

  // Queries
  const { 
    data: organization, 
    isLoading: isLoadingOrg,
    error: orgError 
  } = useGetOrganizationQuery(organizationId, {
    skip: !organizationId
  });

  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useGetOrganizationStatsQuery(organizationId, {
    skip: !organizationId || !canViewOrgStatistics
  });

  const { 
    data: members, 
    isLoading: isLoadingMembers 
  } = useGetOrganizationMembersQuery(organizationId, {
    skip: !organizationId || !canManageOrgUsers
  });

  // Mutations
  const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();
  const [deleteOrganization, { isLoading: isDeleting }] = useDeleteOrganizationMutation();

  // Handlers
  const handleStartEdit = () => {
    if (organization) {
      setEditForm({
        name: organization.name || '',
        type: organization.type || 'gallery',
        description: organization.description || '',
        website: organization.website || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
      });
      setIsEditingInfo(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingInfo(false);
    setEditForm({
      name: '',
      type: '' as OrganizationType,
      description: '',
      website: '',
      contact_email: '',
      contact_phone: '',
    });
  };

  const handleSaveInfo = async () => {
    try {
      await updateOrganization({
        id: organizationId,
        ...editForm
      }).unwrap();
      showSuccess('Organization information updated successfully');
      setIsEditingInfo(false);
    } catch (error: any) {
      showError(error?.message || 'Failed to update organization');
    }
  };

  const handleDeleteOrganization = async () => {
    try {
      await deleteOrganization(organizationId).unwrap();
      showSuccess('Organization deactivated successfully');
      navigate('/dashboard');
    } catch (error: any) {
      showError(error?.message || 'Failed to deactivate organization');
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

  if (isLoadingOrg) {
    return <Loading fullScreen={false} />;
  }

  if (orgError || !organization) {
    return (
      <div className="container mx-auto px-4">
        <div className="alert alert-error">
          <span>Error loading organization details</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <PageHeader 
        title={organization.name}
        subtitle={`${organization.type.charAt(0).toUpperCase() + organization.type.slice(1)} Organization`}
        action={
          <div className="flex gap-2">
            {canManageOrgSettings && (
              <Link to="/dashboard/organization/settings" className="btn btn-outline btn-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            )}
            {isSuperUser && (
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-error btn-sm"
              >
                Deactivate
              </button>
            )}
          </div>
        }
      />

      {/* Organization Info Card */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex justify-between items-start mb-4">
            <h2 className="card-title">Organization Information</h2>
            {canManageOrgSettings && !isEditingInfo && (
              <button 
                onClick={handleStartEdit}
                className="btn btn-sm btn-ghost"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {isEditingInfo ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Organization Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as OrganizationType })}
                  >
                    <option value="gallery">Gallery</option>
                    <option value="museum">Museum</option>
                    <option value="auction_house">Auction House</option>
                    <option value="private_collection">Private Collection</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter organization description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Website</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered w-full"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Contact Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Contact Phone</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered w-full"
                    value={editForm.contact_phone}
                    onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={handleCancelEdit}
                  className="btn btn-ghost"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveInfo}
                  className="btn btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organization.description && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-base-content/70 mb-1">Description</h3>
                  <p className="text-base-content">{organization.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-sm text-base-content/70 mb-1">Type</h3>
                <p className="text-base-content capitalize">{organization.type.replace('_', ' ')}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-base-content/70 mb-1">Status</h3>
                <div className={`badge ${organization.is_active ? 'badge-success' : 'badge-error'}`}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              {organization.website && (
                <div>
                  <h3 className="font-semibold text-sm text-base-content/70 mb-1">Website</h3>
                  <a href={organization.website} target="_blank" rel="noopener noreferrer" className="link link-primary">
                    {organization.website}
                  </a>
                </div>
              )}

              {organization.contact_email && (
                <div>
                  <h3 className="font-semibold text-sm text-base-content/70 mb-1">Contact Email</h3>
                  <a href={`mailto:${organization.contact_email}`} className="link link-primary">
                    {organization.contact_email}
                  </a>
                </div>
              )}

              {organization.contact_phone && (
                <div>
                  <h3 className="font-semibold text-sm text-base-content/70 mb-1">Contact Phone</h3>
                  <p className="text-base-content">{organization.contact_phone}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-sm text-base-content/70 mb-1">Created</h3>
                <p className="text-base-content">
                  {format(new Date(organization.created_at), 'MMMM d, yyyy')}
                </p>
              </div>

              {organization.address && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-base-content/70 mb-1">Address</h3>
                  <p className="text-base-content">
                    {[
                      organization.address.street,
                      organization.address.city,
                      organization.address.state,
                      organization.address.country,
                      organization.address.postal_code
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {canViewOrgStatistics && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Organization Statistics</h2>
          
          {isLoadingStats ? (
            <Loading fullScreen={false} />
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Users"
                value={stats.total_users}
                subtitle={`${stats.active_users} active`}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
              
              <StatsCard
                title="Total Artworks"
                value={stats.total_artworks}
                subtitle="Registered artworks"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              
              <StatsCard
                title="NFC Tags"
                value={stats.total_nfc_tags}
                subtitle={`${stats.active_nfc_tags} active`}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                }
              />
              
              <StatsCard
                title="Appraisals"
                value={stats.total_appraisals}
                subtitle="Completed appraisals"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="alert alert-warning">
              <span>Unable to load statistics</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link 
              to="/dashboard/organization/members"
              className="btn btn-outline justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Manage Members
            </Link>

            <Link 
              to="/dashboard/organization/statistics"
              className="btn btn-outline justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Detailed Statistics
            </Link>

            <Link 
              to="/dashboard/organization/settings"
              className="btn btn-outline justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Organization Settings
            </Link>

            <Link 
              to="/dashboard/artworks"
              className="btn btn-outline justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Artworks
            </Link>

            <Link 
              to="/dashboard/admin/users"
              className="btn btn-outline justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              User Management
            </Link>

            <Link 
              to="/dashboard/appraisals"
              className="btn btn-outline justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Appraisals
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Members Preview */}
      {canManageOrgUsers && members && members.length > 0 && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Recent Members</h2>
              <Link to="/dashboard/organization/members" className="btn btn-sm btn-ghost">
                View All
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.slice(0, 6).map((member: any) => (
                <div key={member.user_id} className="flex items-center space-x-3 p-3 bg-base-200 rounded-lg">
                  <UserAvatar
                    user={{
                      first_name: member.user?.first_name,
                      last_name: member.user?.last_name,
                      avatar_url: member.user?.avatar_url
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user?.first_name} {member.user?.last_name}
                    </p>
                    <p className="text-xs text-base-content/60">
                      <span className="badge badge-xs badge-primary">{member.role}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteOrganization}
        title="Deactivate Organization"
        message={`Are you sure you want to deactivate "${organization.name}"? This will prevent all members from accessing the organization's data.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        isLoading={isDeleting}
        danger={true}
      />
    </div>
  );
};

export default OrganizationPage;