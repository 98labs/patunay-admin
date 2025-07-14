import React from "react";
import { PageHeader } from "@components";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const SuperAdminTest = () => {
  const navigate = useNavigate();
  const { isSuperUser, user } = useAuth();

  if (!isSuperUser) {
    return (
      <div className="p-6">
        <div className="alert alert-warning">
          <span>Access denied. You need super user privileges.</span>
        </div>
        <button 
          className="btn btn-primary mt-4"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Super Admin Test Page"
        subtitle="Testing super admin access"
      />
      
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Current User Info</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Is Super User:</strong> {isSuperUser ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Navigation Test</h2>
          <div className="space-y-2">
            <button 
              className="btn btn-primary"
              onClick={() => navigate("/dashboard/super-admin")}
            >
              Go to Super Admin Dashboard
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate("/dashboard/admin/users")}
            >
              Go to User Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminTest;