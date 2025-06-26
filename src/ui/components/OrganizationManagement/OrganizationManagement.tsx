import React, { useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useGetOrganizationsQuery, useCreateOrganizationMutation, useDeleteOrganizationMutation } from '../../store/api/organizationApi';
import { Organization, OrganizationType, ORGANIZATION_TYPES } from '../../typings';
import { SuperUserGuard } from '../PermissionGuard';
import { OrganizationCard } from './OrganizationCard';
import { CreateOrganizationModal } from './CreateOrganizationModal';

export const OrganizationManagement: React.FC = () => {
  const { canManageOrganizations } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<OrganizationType | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const {
    data: organizationsResponse,
    isLoading,
    error,
    refetch
  } = useGetOrganizationsQuery({
    page,
    pageSize,
    search: searchTerm || undefined,
    type: selectedType || undefined,
    isActive: true,
  });


  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation();
  const [deleteOrganization] = useDeleteOrganizationMutation();

  const handleCreateOrganization = async (organizationData: any) => {
    try {
      await createOrganization(organizationData).unwrap();
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to create organization:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        await deleteOrganization(organizationId).unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to delete organization:', error instanceof Error ? error.message : String(error));
      }
    }
  };

  if (!canManageOrganizations) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <div className="text-red-700 font-medium">Access Denied</div>
          <div className="text-red-600 text-sm mt-1">
            You don't have permission to manage organizations.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700 font-medium">Error loading organizations</div>
          <div className="text-red-600 text-sm mt-1">
            Please try again later.
          </div>
        </div>
      </div>
    );
  }

  const organizations = organizationsResponse?.organizations || [];
  const total = organizationsResponse?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
          <p className="text-gray-600 mt-1">
            Manage organizations, their settings, and memberships
          </p>
        </div>
        
        <SuperUserGuard>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Organization</span>
          </button>
        </SuperUserGuard>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search organizations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="sm:w-48">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OrganizationType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.entries(ORGANIZATION_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedType ? 'Try adjusting your filters' : 'Get started by creating your first organization'}
          </p>
          {!searchTerm && !selectedType && (
            <SuperUserGuard>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Create Organization
              </button>
            </SuperUserGuard>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {organizations.map((organization) => (
              <OrganizationCard
                key={organization.id}
                organization={organization}
                onDelete={handleDeleteOrganization}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} organizations
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === page || Math.abs(pageNum - page) <= 2 || pageNum === 1 || pageNum === totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm border rounded-md ${
                          pageNum === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (Math.abs(pageNum - page) === 3) {
                    return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateOrganization}
          isLoading={isCreating}
        />
      )}
    </div>
  );
};