import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Building2, Phone, Mail, Users } from 'lucide-react';
import { PageHeader, Loading } from '@components';
import { LocationForm } from '../../components/locations/LocationForm';
import { getLocations, createLocation, updateLocation, deleteLocation, LocationWithManager, getFullName } from '../../lib/api/locations';
import { CreateLocationData, UpdateLocationData } from '../../typings';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { usePermissions } from '../../hooks/usePermissions';

const Locations: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { currentOrganization } = useAuth();
  const { canManageOrgSettings, canManageOrgUsers } = usePermissions();
  
  const [locations, setLocations] = useState<LocationWithManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithManager | undefined>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<LocationWithManager | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      loadLocations();
    }
  }, [currentOrganization]);

  const loadLocations = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await getLocations(currentOrganization.id);
      setLocations(data);
    } catch (error) {
      showError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (locationData: CreateLocationData | Partial<UpdateLocationData>) => {
    try {
      if (selectedLocation) {
        await updateLocation(selectedLocation.id, locationData);
        showSuccess('Location updated successfully');
      } else {
        await createLocation(locationData);
        showSuccess('Location created successfully');
      }
      await loadLocations();
      setFormOpen(false);
      setSelectedLocation(undefined);
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation(locationToDelete.id);
      showSuccess('Location deleted successfully');
      await loadLocations();
    } catch (error) {
      showError('Failed to delete location');
    } finally {
      setDeleteModalOpen(false);
      setLocationToDelete(null);
    }
  };

  const openEditForm = (location: LocationWithManager) => {
    setSelectedLocation(location);
    setFormOpen(true);
  };

  const openDeleteDialog = (location: LocationWithManager) => {
    setLocationToDelete(location);
    setDeleteModalOpen(true);
  };

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-base-content/60">Please select an organization</p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  // Temporarily allow all authenticated users to manage locations for testing
  // TODO: Revert this after proper permissions are set up
  const canManageLocations = true; // canManageOrgSettings || canManageOrgUsers;

  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="Locations"
        subtitle="Manage your organization's locations and branches"
        action={
          canManageLocations && (
            <button
              className="btn btn-primary"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </button>
          )
        }
      />

      {locations.length === 0 ? (
        <div className="card bg-base-100 border-dashed border-2 border-base-300">
          <div className="card-body flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-base-content/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-base-content/60 text-center mb-4">
              Add your first location to start organizing your operations
            </p>
            {canManageLocations && (
              <button
                className="btn btn-primary"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Location
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div key={location.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="card-title flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {location.name}
                    </h3>
                    {location.code && (
                      <p className="text-sm text-base-content/60 mt-1">
                        Code: {location.code}
                      </p>
                    )}
                  </div>
                  
                  {canManageLocations && (
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </label>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a onClick={() => navigate(`/dashboard/organization/locations/${location.id}`)}>
                            <Users className="w-4 h-4" />
                            Manage Users
                          </a>
                        </li>
                        <li>
                          <a onClick={() => openEditForm(location)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </a>
                        </li>
                        <li>
                          <a className="text-error" onClick={() => openDeleteDialog(location)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  {location.is_headquarters && (
                    <span className="badge badge-secondary">Headquarters</span>
                  )}
                  
                  {(location.city || location.country) && (
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[location.city, location.state, location.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  {location.phone && (
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                      <Phone className="h-4 w-4" />
                      <span>{location.phone}</span>
                    </div>
                  )}

                  {location.email && (
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{location.email}</span>
                    </div>
                  )}

                  {location.manager && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium">Manager</p>
                      <p className="text-sm text-base-content/60">
                        {getFullName(location.manager.first_name, location.manager.last_name)}
                      </p>
                    </div>
                  )}

                  {!location.is_active && (
                    <span className="badge badge-outline text-base-content/60">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <LocationForm
          location={selectedLocation}
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setSelectedLocation(undefined);
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Location</h3>
            <p className="py-4">
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
              All users assigned to this location will be unassigned.
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locations;