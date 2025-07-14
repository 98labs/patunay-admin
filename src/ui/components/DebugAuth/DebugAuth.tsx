import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

export const DebugAuth: React.FC = () => {
  const auth = useAuth();
  const permissions = usePermissions();

  return (
    <div className="p-6 bg-base-200 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🔍 Auth Debug Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">User Info</h3>
            <div className="space-y-2">
              <p><strong>ID:</strong> {auth.user?.id || 'null'}</p>
              <p><strong>Email:</strong> {auth.user?.email || 'null'}</p>
              <p><strong>Role:</strong> {auth.user?.role || 'null'}</p>
              <p><strong>Is Active:</strong> {auth.user?.is_active ? 'Yes' : 'No'}</p>
              <p><strong>Organization ID:</strong> {auth.user?.organization_id || 'null'}</p>
            </div>
          </div>
        </div>

        {/* Role Checks */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Role Checks</h3>
            <div className="space-y-2">
              <p><strong>isSuperUser:</strong> {auth.isSuperUser ? '✅ Yes' : '❌ No'}</p>
              <p><strong>isAdmin:</strong> {auth.isAdmin ? '✅ Yes' : '❌ No'}</p>
              <p><strong>isIssuer:</strong> {auth.isIssuer ? '✅ Yes' : '❌ No'}</p>
              <p><strong>isAppraiser:</strong> {auth.isAppraiser ? '✅ Yes' : '❌ No'}</p>
              <p><strong>isStaff:</strong> {auth.isStaff ? '✅ Yes' : '❌ No'}</p>
              <p><strong>isViewer:</strong> {auth.isViewer ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        </div>

        {/* Organization Context */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Organization Context</h3>
            <div className="space-y-2">
              <p><strong>Current Org:</strong> {auth.currentOrganization?.name || 'null'}</p>
              <p><strong>Current Org ID:</strong> {auth.currentOrganization?.id || 'null'}</p>
              <p><strong>Total Orgs:</strong> {auth.organizations.length}</p>
              <div>
                <strong>Organizations:</strong>
                <ul className="ml-4 list-disc">
                  {auth.organizations.map(org => (
                    <li key={org.organization_id}>
                      {org.organization?.name} ({org.role}) {org.is_primary ? '(Primary)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Key Permissions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Key Permissions</h3>
            <div className="space-y-2">
              <p><strong>canManageOrganizations:</strong> {permissions.canManageOrganizations ? '✅ Yes' : '❌ No'}</p>
              <p><strong>canViewAllStatistics:</strong> {permissions.canViewAllStatistics ? '✅ Yes' : '❌ No'}</p>
              <p><strong>canManageAllUsers:</strong> {permissions.canManageAllUsers ? '✅ Yes' : '❌ No'}</p>
              <p><strong>canManageAllArtworks:</strong> {permissions.canManageAllArtworks ? '✅ Yes' : '❌ No'}</p>
              <p><strong>canManageAllNfcTags:</strong> {permissions.canManageAllNfcTags ? '✅ Yes' : '❌ No'}</p>
              <p><strong>canManageSystem:</strong> {permissions.canManageSystem ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Specific Permissions */}
      <div className="mt-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Permission Tests</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <strong>manage_organizations:</strong><br/>
                {auth.hasPermission('manage_organizations') ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>view_all_statistics:</strong><br/>
                {auth.hasPermission('view_all_statistics') ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>manage_all_users:</strong><br/>
                {auth.hasPermission('manage_all_users') ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>manage_system:</strong><br/>
                {auth.hasPermission('manage_system') ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};