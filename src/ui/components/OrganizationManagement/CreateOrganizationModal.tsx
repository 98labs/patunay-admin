import React, { useState } from 'react';
import { OrganizationType, ORGANIZATION_TYPES, CreateOrganizationData } from '../../typings';

interface CreateOrganizationModalProps {
  onClose: () => void;
  onSubmit: (data: CreateOrganizationData) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  onClose,
  onSubmit,
  isLoading,
  error
}) => {
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    type: 'other',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    
    // Clear previous submit error
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }

    // Clean up empty address fields
    const cleanedData = {
      ...formData,
      address: Object.fromEntries(
        Object.entries(formData.address || {}).filter(([_, value]) => value?.trim())
      ),
    };

    try {
      await onSubmit(cleanedData);
    } catch (error) {
      // Error is handled in parent component
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold">Create New Organization</h3>
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
          {(error || submitError) && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error || submitError}</span>
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
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter organization name"
                  />
                  {errors.name && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.name}</span>
                    </label>
                  )}
                </div>

                {/* Organization Type */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value as OrganizationType)}
                  >
                    {Object.entries(ORGANIZATION_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>
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
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the organization..."
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
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="email"
                    className={`input input-bordered w-full ${errors.contact_email ? 'input-error' : ''}`}
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@organization.com"
                  />
                  {errors.contact_email && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.contact_email}</span>
                    </label>
                  )}
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Contact Phone</span>
                  </label>
                  <input
                    type="tel"
                    className={`input input-bordered w-full ${errors.contact_phone ? 'input-error' : ''}`}
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.contact_phone && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.contact_phone}</span>
                    </label>
                  )}
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
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.organization.com"
                />
                {errors.website && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.website}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="divider"></div>

            {/* Address Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-base-content/80">Address <span className="text-sm font-normal text-base-content/60">(Optional)</span></h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Street Address</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.address?.street || ''}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">City</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">State/Province</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="State/Province"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Country</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.address?.country || ''}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Postal Code</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.address?.postal_code || ''}
                    onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-base-200">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Creating...
                </>
              ) : (
                'Create Organization'
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