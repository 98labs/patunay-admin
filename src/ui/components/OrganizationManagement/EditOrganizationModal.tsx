import React, { useState } from 'react';
import { Organization, OrganizationType, ORGANIZATION_TYPES } from '../../typings';

interface EditOrganizationModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Partial<Organization>) => Promise<void>;
  error?: string | null;
}

export const EditOrganizationModal: React.FC<EditOrganizationModalProps> = ({
  organization,
  isOpen,
  onClose,
  onSave,
  error
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: organization.name || '',
    type: organization.type || 'other' as OrganizationType,
    description: organization.description || '',
    website: organization.website || '',
    contact_email: organization.contact_email || '',
    contact_phone: organization.contact_phone || '',
    address: organization.address || {},
    settings: organization.settings || {}
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Organization name must be less than 100 characters';
    }

    // Email validation - now required
    if (!formData.contact_email) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    // Optional field validations
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL (including http:// or https://)';
    }

    if (formData.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error saving organization:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold">Edit Organization</h3>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-base-content/80">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Organization Name</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Organization Type */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Type</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as OrganizationType })}
                    required
                  >
                    {Object.entries(ORGANIZATION_TYPES).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter organization description"
                />
              </div>
            </div>

            <div className="divider"></div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-base-content/80">Contact Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Contact Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
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
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Website</span>
                </label>
                <input
                  type="url"
                  className={`input input-bordered w-full ${errors.website ? 'input-error' : ''}`}
                  value={formData.website}
                  onChange={(e) => {
                    setFormData({ ...formData, website: e.target.value });
                    if (errors.website) setErrors({ ...errors, website: '' });
                  }}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.website}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-base-200">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal backdrop */}
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
};