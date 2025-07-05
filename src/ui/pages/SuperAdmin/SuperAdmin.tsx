import React, { useState, useEffect } from "react";
import { PageHeader, Loading, UserAvatar } from "@components";
import { useGetUsersQuery } from "../../store/api/userManagementApi";
import { User } from "../../typings";
import { format } from "date-fns";
import { usePermissions } from "../../hooks/usePermissions";
import { useNavigate } from "react-router-dom";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { canManageAllUsers, isSuperUser } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Check permissions
  useEffect(() => {
    if (!isSuperUser) {
      navigate("/dashboard");
    }
  }, [isSuperUser, navigate]);

  // Fetch all users
  const { data: usersResponse, isLoading, refetch } = useGetUsersQuery({
    page: 1,
    pageSize: 100, // Get more users to ensure we get all super users
    filters: {
      role: 'super_user' as const
    }
  }, {
    refetchOnMountOrArgChange: true,
  });

  // Extract users from response
  const superUsers = usersResponse?.data || [];
  
  // Debug log
  console.log('SuperAdmin - usersResponse:', usersResponse);
  console.log('SuperAdmin - superUsers:', superUsers);
  
  // Apply search filter
  const filteredSuperUsers = superUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const firstName = (user.first_name || '').toString();
    const lastName = (user.last_name || '').toString();
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const email = (user.email || '').toString().toLowerCase();
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Users"
        subtitle={`Managing ${superUsers.length} super admin${superUsers.length !== 1 ? 's' : ''} with system-wide access`}
      />

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search super admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="btn btn-outline btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Super Users Grid */}
      {filteredSuperUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium">No super admins found</h3>
            <p className="mt-1 text-sm text-base-content/60">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No users with super admin role exist.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuperUsers.map((user) => (
            <div
              key={user.id}
              className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <UserAvatar
                      user={user}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.first_name || user.last_name ? (
                          <>
                            {user.first_name} {user.last_name}
                          </>
                        ) : (
                          'Unnamed User'
                        )}
                      </h3>
                      <p className="text-sm text-base-content/70">{String(user.email || '')}</p>
                    </div>
                  </div>
                  <div className="badge badge-primary badge-sm">Super Admin</div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Status:</span>
                    <span>
                      {user.is_active ? (
                        <span className="badge badge-success badge-sm">Active</span>
                      ) : (
                        <span className="badge badge-error badge-sm">Inactive</span>
                      )}
                    </span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Phone:</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Created:</span>
                    <span>
                      {(() => {
                        try {
                          return user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'Unknown';
                        } catch (e) {
                          console.error('Error formatting created date:', e, user.created_at);
                          return 'Invalid date';
                        }
                      })()}
                    </span>
                  </div>
                  
                  {user.last_login_at && (
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Last Login:</span>
                      <span>
                        {(() => {
                          try {
                            return format(new Date(user.last_login_at), 'MMM d, yyyy');
                          } catch (e) {
                            console.error('Error formatting last login date:', e, user.last_login_at);
                            return 'Invalid date';
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Organization Info */}
                {user.organizations && Array.isArray(user.organizations) && user.organizations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-base-300">
                    <p className="text-sm font-medium mb-2">Organizations:</p>
                    <div className="space-y-1">
                      {user.organizations.map((org, index) => (
                        <div key={org?.id || index} className="text-sm">
                          <span className="font-medium">{org?.organization?.name || org?.name || 'Unknown Organization'}</span>
                          {org?.is_primary && (
                            <span className="badge badge-sm badge-outline ml-2">Primary</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {canManageAllUsers && (
                  <div className="card-actions justify-end mt-4">
                    <button
                      onClick={() => navigate(`/dashboard/admin/users/${user.id}`)}
                      className="btn btn-sm btn-ghost"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="stat-title">Total Super Admins</div>
          <div className="stat-value">{superUsers.length}</div>
          <div className="stat-desc">System-wide administrators</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-success">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-title">Active</div>
          <div className="stat-value">{superUsers.filter(u => u.is_active).length}</div>
          <div className="stat-desc">Currently active super admins</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div className="stat-title">Organizations</div>
          <div className="stat-value">
            {(() => {
              try {
                const orgIds = superUsers.flatMap(u => {
                  if (!u.organizations || !Array.isArray(u.organizations)) return [];
                  return u.organizations.map(o => o?.organization_id || o?.id).filter(Boolean);
                });
                return new Set(orgIds).size;
              } catch (e) {
                console.error('Error calculating organizations:', e);
                return 0;
              }
            })()}
          </div>
          <div className="stat-desc">Unique organizations managed</div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;