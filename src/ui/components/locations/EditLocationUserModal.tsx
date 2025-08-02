import React, { useState } from 'react';
import { FormField } from '@components';
import { updateLocationUser, LocationUserWithDetails, getFullName } from '../../lib/api/locations';
import { format } from 'date-fns';

interface EditLocationUserModalProps {
  open: boolean;
  onClose: () => void;
  locationUser: LocationUserWithDetails;
  onSuccess: () => void;
}

export function EditLocationUserModal({
  open,
  onClose,
  locationUser,
  onSuccess
}: EditLocationUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    role: locationUser.role,
    department: locationUser.department || '',
    position: locationUser.position || '',
    employee_id: locationUser.employee_id || '',
    is_primary_location: locationUser.is_primary_location,
    can_access_other_locations: locationUser.can_access_other_locations,
    is_active: locationUser.is_active
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await updateLocationUser(locationUser.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user assignment');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Edit User Assignment</h3>

        <div className="alert mb-4">
          <div>
            <p className="font-medium">{
              locationUser.user.first_name || locationUser.user.last_name ?
                getFullName(locationUser.user.first_name, locationUser.user.last_name) :
                locationUser.user.email
            }</p>
            {((locationUser.user.first_name || locationUser.user.last_name) && locationUser.user.email) && (
              <p className="text-sm">{locationUser.user.email}</p>
            )}
            <p className="text-sm mt-1">
              Location: {locationUser.location.name}
            </p>
            {locationUser.start_date && (
              <p className="text-sm">
                Assigned since: {format(new Date(locationUser.start_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Role at Location</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Sales"
            />

            <FormField
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Branch Manager"
            />
          </div>

          <FormField
            label="Employee ID"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            placeholder="Optional employee identifier"
          />

          <div className="space-y-4">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">
                  <span className="font-medium">Primary Location</span>
                  <span className="block text-sm text-base-content/60">
                    Set as the user's main work location
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.is_primary_location}
                  onChange={(e) => setFormData({ ...formData, is_primary_location: e.target.checked })}
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">
                  <span className="font-medium">Access Other Locations</span>
                  <span className="block text-sm text-base-content/60">
                    Allow access to other organization locations
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.can_access_other_locations}
                  onChange={(e) => setFormData({ ...formData, can_access_other_locations: e.target.checked })}
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">
                  <span className="font-medium">Active Assignment</span>
                  <span className="block text-sm text-base-content/60">
                    Deactivate to temporarily remove access
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              </label>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="loading loading-spinner loading-sm mr-2"></span>}
              Update Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}