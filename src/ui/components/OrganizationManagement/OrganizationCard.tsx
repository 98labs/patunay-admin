import React, { useState } from 'react';
import { Organization, ORGANIZATION_TYPES } from '../../typings';
import { useGetOrganizationStatsQuery, useUpdateOrganizationMutation } from '../../store/api/organizationApi';
import { SuperUserGuard } from '../PermissionGuard';
import { EditOrganizationModal } from './EditOrganizationModal';
import { useNotification } from '../../hooks/useNotification';

interface OrganizationCardProps {
  organization: Organization;
  onDelete: (organizationId: string) => void;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onDelete
}) => {
  const { data: stats, isLoading: statsLoading } = useGetOrganizationStatsQuery(organization.id);
  const [updateOrganization] = useUpdateOrganizationMutation();
  const { showSuccess, showError } = useNotification();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const organizationType = ORGANIZATION_TYPES[organization.type];

  const handleEdit = async (formData: any) => {
    setEditError(null);
    try {
      await updateOrganization({
        id: organization.id,
        ...formData
      }).unwrap();
      showSuccess('Organization updated successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Failed to update organization:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to update organization';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.error?.message) {
        errorMessage = error.data.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check for specific error types
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        errorMessage = 'Permission denied: You do not have permission to update this organization.';
      } else if (errorMessage.includes('duplicate')) {
        errorMessage = 'An organization with this name already exists.';
      } else if (errorMessage.includes('constraint')) {
        errorMessage = 'Invalid data: Please check all required fields.';
      }
      
      setEditError(errorMessage);
      showError(errorMessage);
      throw error; // Re-throw to prevent modal from closing
    }
  };

  return (
    <>
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1">
              {organization.name}
            </h3>
            <span className="badge badge-primary badge-sm">
              {organizationType?.label || organization.type}
            </span>
          </div>
          
          <SuperUserGuard>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-base-content/40 hover:text-base-content/60"
                title="Edit organization"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={() => onDelete(organization.id)}
                className="text-base-content/40 hover:text-error"
                title="Delete organization"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </SuperUserGuard>
        </div>

        {/* Description */}
        {organization.description && (
          <p className="text-base-content/60 text-sm mb-4 line-clamp-2">
            {organization.description}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {organization.contact_email && (
            <div className="flex items-center text-sm text-base-content/60">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{organization.contact_email}</span>
            </div>
          )}
          
          {organization.website && (
            <div className="flex items-center text-sm text-base-content/60">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              <a 
                href={organization.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-focus truncate"
              >
                {organization.website}
              </a>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="border-t border-base-200 pt-4">
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-base-300 rounded"></div>
                <div className="h-8 bg-base-300 rounded"></div>
              </div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">{stats.active_users}</div>
                <div className="text-base-content/50">Active Users</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium">{stats.total_artworks}</div>
                <div className="text-base-content/50">Artworks</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium">{stats.active_nfc_tags}</div>
                <div className="text-base-content/50">Active Tags</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium">{stats.total_appraisals}</div>
                <div className="text-base-content/50">Appraisals</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-base-content/50 text-sm">
              No statistics available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-base-200 pt-4 mt-4">
          <div className="flex items-center justify-between text-xs text-base-content/50">
            <span>
              Created {organization.created_at ? new Date(organization.created_at).toLocaleDateString() : 'Unknown'}
            </span>
            <div className={`w-2 h-2 rounded-full ${organization.is_active ? 'bg-success' : 'bg-error'}`} />
          </div>
        </div>
      </div>
    </div>

    {/* Edit Modal */}
    {isEditModalOpen && (
      <EditOrganizationModal
        organization={organization}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditError(null);
        }}
        onSave={handleEdit}
        error={editError}
      />
    )}
    </>
  );
};