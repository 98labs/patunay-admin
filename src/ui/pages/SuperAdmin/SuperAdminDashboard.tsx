import React from "react";
import { PageHeader } from "@components";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { useGetUsersQuery } from "../../store/api/userManagementApi";
import { useGetOrganizationsQuery } from "../../store/api/organizationApi";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { canManageOrganizations, canManageAllUsers, canViewAllStatistics } = usePermissions();

  // Fetch data for statistics
  const { data: usersResponse } = useGetUsersQuery({
    page: 1,
    pageSize: 100,
    role: 'super_user' as const
  });

  const { data: organizationsResponse } = useGetOrganizationsQuery({
    page: 1,
    pageSize: 100
  });

  const superUserCount = usersResponse?.users?.length || 0;
  const organizationCount = organizationsResponse?.organizations?.length || 0;

  const navigationCards = [
    {
      title: "Organizations",
      description: "Manage all organizations in the system",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: "/dashboard/super-admin/organizations",
      stats: `${organizationCount} organizations`,
      color: "bg-primary",
      permission: canManageOrganizations
    },
    {
      title: "System Users",
      description: "View all super admin users in the system",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      path: "/dashboard/super-admin/users",
      stats: `${superUserCount} super admins`,
      color: "bg-secondary",
      permission: canManageAllUsers
    },
    {
      title: "System Statistics",
      description: "View system-wide statistics and analytics",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: "/dashboard/super-admin/stats",
      stats: "View analytics",
      color: "bg-accent",
      permission: canViewAllStatistics
    },
    {
      title: "Migration Verification",
      description: "Verify and manage system migrations",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      path: "/dashboard/super-admin/migration-verification",
      stats: "Check status",
      color: "bg-warning",
      permission: true // Always show for super users
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Manage system-wide settings and configurations"
      />

      {/* Quick Stats */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="stat-title">Total Organizations</div>
          <div className="stat-value">{organizationCount}</div>
          <div className="stat-desc">Active organizations in the system</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="stat-title">Super Admins</div>
          <div className="stat-value">{superUserCount}</div>
          <div className="stat-desc">System administrators</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-accent">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-title">System Status</div>
          <div className="stat-value text-success">Active</div>
          <div className="stat-desc">All systems operational</div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {navigationCards.filter(card => card.permission).map((card) => (
          <div
            key={card.path}
            onClick={() => navigate(card.path)}
            className="card bg-base-100 shadow-md hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="card-body">
              <div className={`w-16 h-16 ${card.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="card-title text-lg">{card.title}</h3>
              <p className="text-sm text-base-content/70">{card.description}</p>
              <div className="mt-4 pt-4 border-t border-base-300">
                <p className="text-sm font-medium">{card.stats}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/dashboard/super-admin/organizations")}
              className="btn btn-outline btn-block justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Organization
            </button>
            <button
              onClick={() => navigate("/dashboard/admin/users")}
              className="btn btn-outline btn-block justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Manage All Users
            </button>
            <button
              onClick={() => navigate("/dashboard/super-admin/stats")}
              className="btn btn-outline btn-block justify-start"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View System Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;