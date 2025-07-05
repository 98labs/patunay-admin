import React from 'react';
import { Organization, ORGANIZATION_TYPES } from '../../typings';
import { useGetOrganizationStatsQuery } from '../../store/api/organizationApi';
import { SuperUserGuard } from '../PermissionGuard';

interface OrganizationCardProps {
  organization: Organization;
  onDelete: (organizationId: string) => void;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onDelete
}) => {
  const { data: stats, isLoading: statsLoading } = useGetOrganizationStatsQuery(organization.id);

  const organizationType = ORGANIZATION_TYPES[organization.type];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {organization.name}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {organizationType?.label || organization.type}
            </span>
          </div>
          
          <SuperUserGuard>
            <div className="flex space-x-2">
              <button
                onClick={() => {/* TODO: Edit functionality */}}
                className="text-gray-400 hover:text-gray-600"
                title="Edit organization"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={() => onDelete(organization.id)}
                className="text-gray-400 hover:text-red-600"
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
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {organization.description}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {organization.contact_email && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{organization.contact_email}</span>
            </div>
          )}
          
          {organization.website && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              <a 
                href={organization.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 truncate"
              >
                {organization.website}
              </a>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="border-t border-gray-100 pt-4">
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{stats.active_users}</div>
                <div className="text-gray-500">Active Users</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-900">{stats.total_artworks}</div>
                <div className="text-gray-500">Artworks</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-900">{stats.active_nfc_tags}</div>
                <div className="text-gray-500">Active Tags</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-900">{stats.total_appraisals}</div>
                <div className="text-gray-500">Appraisals</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm">
              No statistics available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Created {organization.created_at ? new Date(organization.created_at).toLocaleDateString() : 'Unknown'}
            </span>
            <div className={`w-2 h-2 rounded-full ${organization.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};