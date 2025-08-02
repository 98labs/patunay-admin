import React from "react";
import { PageHeader } from "@components";
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';
import { usePermissions } from "../../hooks/usePermissions";
import { useNavigate } from "react-router-dom";

const DebugPermissions = () => {
  const navigate = useNavigate();
  const { user, isSuperUser, hasRole } = useAuth();
  const permissions = usePermissions();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Debug Permissions"
        subtitle="Check your current user permissions"
      />
      
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Current User</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Email:</strong> {user?.email || 'No email'}</p>
            <p><strong>Role:</strong> {user?.role || 'No role'}</p>
            <p><strong>Is Active:</strong> {user?.is_active ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Role Checks</h2>
          <div className="space-y-2">
            <p><strong>isSuperUser:</strong> {isSuperUser ? '✅ Yes' : '❌ No'}</p>
            <p><strong>hasRole('super_user'):</strong> {hasRole('super_user') ? '✅ Yes' : '❌ No'}</p>
            <p><strong>hasRole('admin'):</strong> {hasRole('admin') ? '✅ Yes' : '❌ No'}</p>
            <p><strong>hasRole('issuer'):</strong> {hasRole('issuer') ? '✅ Yes' : '❌ No'}</p>
            <p><strong>hasRole('appraiser'):</strong> {hasRole('appraiser') ? '✅ Yes' : '❌ No'}</p>
            <p><strong>hasRole('staff'):</strong> {hasRole('staff') ? '✅ Yes' : '❌ No'}</p>
            <p><strong>hasRole('viewer'):</strong> {hasRole('viewer') ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Key Permissions</h2>
          <div className="space-y-2">
            <p><strong>canManageOrganizations:</strong> {permissions.canManageOrganizations ? '✅ Yes' : '❌ No'}</p>
            <p><strong>canManageAllUsers:</strong> {permissions.canManageAllUsers ? '✅ Yes' : '❌ No'}</p>
            <p><strong>canManageSystem:</strong> {permissions.canManageSystem ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>

      {!isSuperUser && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold">You don't have super user permissions!</h3>
            <p className="text-sm">To access Super Admin features, your user role needs to be set to 'super_user' in the database.</p>
            <p className="text-sm mt-2">Ask a database administrator to run:</p>
            <code className="text-xs bg-base-300 p-1 rounded">
              UPDATE profiles SET role = 'super_user' WHERE email = '{user?.email || 'your-email'}';
            </code>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button 
          className="btn btn-primary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
        {isSuperUser && (
          <button 
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard/super-admin/users")}
          >
            Go to Super Admin Users
          </button>
        )}
      </div>
    </div>
  );
};

export default DebugPermissions;