import React, { useState, useEffect } from 'react';
import { FormField } from '@components';
import { Location, CreateLocationData, UpdateLocationData } from '../../typings';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../supabase';

interface LocationFormProps {
  location?: Location;
  open: boolean;
  onClose: () => void;
  onSave: (location: CreateLocationData | Partial<UpdateLocationData>) => Promise<void>;
}

export function LocationForm({ location, open, onClose, onSave }: LocationFormProps) {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<Array<{ id: string; first_name: string; last_name: string; email?: string }>>([]);
  
  const [formData, setFormData] = useState({
    name: location?.name || '',
    code: location?.code || '',
    description: location?.description || '',
    street: location?.street || '',
    city: location?.city || '',
    state: location?.state || '',
    country: location?.country || '',
    postal_code: location?.postal_code || '',
    phone: location?.phone || '',
    email: location?.email || '',
    manager_id: location?.manager_id || '',
    is_headquarters: location?.is_headquarters || false,
    is_active: location?.is_active ?? true
  });

  useEffect(() => {
    if (open && currentOrganization) {
      loadManagers();
    }
  }, [open, currentOrganization]);

  const loadManagers = async () => {
    if (!currentOrganization) return;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        organization_users!inner(
          role
        )
      `)
      .eq('organization_users.organization_id', currentOrganization.id)
      .eq('organization_users.is_active', true)
      .in('organization_users.role', ['admin', 'staff']);

    if (!error && data) {
      setManagers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const locationData: CreateLocationData | Partial<UpdateLocationData> = {
        ...formData,
        organization_id: currentOrganization?.id,
        // Convert empty string to null for UUID fields
        manager_id: formData.manager_id || null
      };

      await onSave(locationData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">
          {location ? 'Edit Location' : 'Create New Location'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Location Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Branch"
            />

            <FormField
              label="Location Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., MNL, CEB, DVO"
            />
          </div>

          <FormField
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this location"
            rows={3}
          />

          <div className="divider">Address</div>

          <FormField
            label="Street Address"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            placeholder="123 Ayala Avenue"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Makati City"
            />

            <FormField
              label="Province/Region"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Metro Manila"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Philippines"
            />

            <FormField
              label="Postal Code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="1226"
            />
          </div>

          <div className="divider">Contact Information</div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+63 (2) 8123-4567"
            />

            <FormField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="branch@company.ph"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Location Manager</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={formData.manager_id || ''}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
            >
              <option value="">No manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {[manager.first_name, manager.last_name].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="divider">Settings</div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                <span className="font-medium">Headquarters</span>
                <span className="block text-sm text-base-content/60">
                  Mark this location as the organization's headquarters
                </span>
              </span>
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={formData.is_headquarters}
                onChange={(e) => setFormData({ ...formData, is_headquarters: e.target.checked })}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                <span className="font-medium">Active</span>
                <span className="block text-sm text-base-content/60">
                  Deactivate to hide this location without deleting it
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

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="loading loading-spinner loading-sm mr-2"></span>}
              {location ? 'Update Location' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}