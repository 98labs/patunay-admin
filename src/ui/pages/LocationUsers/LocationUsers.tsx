import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shield, Calendar, Building, User } from 'lucide-react';
import { PageHeader, Loading, UserAvatar } from '@components';
import { AddUserToLocationDialog } from '../../components/locations/AddUserToLocationDialog';
import { EditLocationUserDialog } from '../../components/locations/EditLocationUserDialog';
import { getLocation, getLocationUsers, removeUserFromLocation, LocationWithManager, LocationUserWithDetails, getFullName } from '../../lib/api/locations';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { usePermissions } from '../../hooks/usePermissions';

const LocationUsers: React.FC = () => {
  const { id: locationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { currentOrganization } = useAuth();
  const { canManageOrgUsers } = usePermissions();
  // Temporarily allow all authenticated users to manage location users for testing
  // TODO: Revert this after proper permissions are set up
  const canManageLocationUsers = true; // canManageOrgUsers;
  
  const [location, setLocation] = useState<LocationWithManager | null>(null);
  const [users, setUsers] = useState<LocationUserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LocationUserWithDetails | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<LocationUserWithDetails | null>(null);

  useEffect(() => {
    if (locationId && currentOrganization) {
      loadLocationData();
    }
  }, [locationId, currentOrganization]);

  const loadLocationData = async () => {
    if (!locationId) return;

    try {
      setLoading(true);
      const [locationData, usersData] = await Promise.all([
        getLocation(locationId),
        getLocationUsers(locationId)
      ]);
      setLocation(locationData);
      setUsers(usersData);
    } catch (error) {
      showError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete) return;

    try {
      await removeUserFromLocation(userToDelete.id);
      showSuccess('User removed from location');
      await loadLocationData();
    } catch (error) {
      showError('Failed to remove user');
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const openEditDialog = (user: LocationUserWithDetails) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const openDeleteDialog = (user: LocationUserWithDetails) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-primary';
      case 'staff':
        return 'badge-secondary';
      default:
        return '';
    }
  };

  if (!currentOrganization || !locationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-base-content/60">Please select an organization</p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <button
          className="btn btn-ghost btn-sm mb-4"
          onClick={() => navigate('/dashboard/organization/locations')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Locations
        </button>
        
        <PageHeader
          title={`${location?.name || 'Location'} Users`}
          subtitle="Manage users assigned to this location"
          action={
            canManageLocationUsers && (
              <button
                className="btn btn-primary"
                onClick={() => setAddUserOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </button>
            )
          }
        />
      </div>

      {users.length === 0 ? (
        <div className="card bg-base-100 border-dashed border-2 border-base-300">
          <div className="card-body flex flex-col items-center justify-center py-16">
            <User className="h-12 w-12 text-base-content/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users assigned</h3>
            <p className="text-base-content/60 text-center mb-4">
              Add users to this location to manage access and permissions
            </p>
            {canManageOrgUsers && (
              <button
                className="btn btn-primary"
                onClick={() => setAddUserOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First User
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      user={{
                        first_name: user.user.first_name || user.user.email?.split('@')[0] || '',
                        last_name: user.user.last_name || '',
                        avatar_url: user.user.avatar_url
                      }}
                      size="lg"
                    />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{
                          user.user.first_name || user.user.last_name ? 
                            getFullName(user.user.first_name, user.user.last_name) : 
                            user.user.email
                        }</h3>
                        {user.is_primary_location && (
                          <span className="badge badge-secondary badge-sm">
                            Primary Location
                          </span>
                        )}
                      </div>
                      {((user.user.first_name || user.user.last_name) && user.user.email) && (
                        <p className="text-sm text-base-content/60">{user.user.email}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-base-content/60" />
                          <span className={`badge ${getRoleBadgeClass(user.role)} badge-sm`}>
                            {user.role}
                          </span>
                        </div>
                        
                        {user.department && (
                          <div className="flex items-center gap-1 text-xs text-base-content/60">
                            <Building className="h-3 w-3" />
                            {user.department}
                          </div>
                        )}
                        
                        {user.start_date && (
                          <div className="flex items-center gap-1 text-xs text-base-content/60">
                            <Calendar className="h-3 w-3" />
                            Since {format(new Date(user.start_date), 'MMM yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {canManageLocationUsers && (
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </label>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a onClick={() => openEditDialog(user)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Assignment
                          </a>
                        </li>
                        <li>
                          <a
                            className="text-error"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                            </svg>
                            Remove from Location
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {location && (
        <>
          <AddUserToLocationDialog
            open={addUserOpen}
            onClose={() => setAddUserOpen(false)}
            locationId={locationId}
            organizationId={currentOrganization.id}
            onSuccess={loadLocationData}
          />

          {selectedUser && (
            <EditLocationUserDialog
              open={editUserOpen}
              onClose={() => {
                setEditUserOpen(false);
                setSelectedUser(null);
              }}
              locationUser={selectedUser}
              onSuccess={loadLocationData}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Remove User from Location</h3>
            <p className="py-4">
              Are you sure you want to remove {
                userToDelete ? (
                  userToDelete.user.first_name || userToDelete.user.last_name ?
                    getFullName(userToDelete.user.first_name, userToDelete.user.last_name) :
                    userToDelete.user.email
                ) : ''
              } from this location?
              They will lose access to location-specific resources.
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleRemoveUser}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationUsers;