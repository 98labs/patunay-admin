import React, { useState, useEffect, useMemo } from "react";
import { PageHeader, Loading, UserAvatar } from "@components";
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';
import { useNavigate } from "react-router-dom";
import supabase from "../../supabase";
import { format } from "date-fns";
import { useToast, ToastContainer } from "../../components/Toast/Toast";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { isSuperUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Toast system
  const { toasts, showToast, removeToast } = useToast();

  // Fetch users directly with Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching super users directly from Supabase...');
        
        // First check if we can access profiles table
        const { data: testAccess, error: accessError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
          
        if (accessError) {
          console.error('Cannot access profiles table:', accessError);
          setError(`Database access error: ${accessError.message}`);
          return;
        }
        
        // Query profiles with super_user role (without email since it's not in profiles table)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            role,
            is_active,
            phone,
            avatar_url,
            created_at,
            updated_at,
            last_login_at
          `)
          .eq('role', 'super_user')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error('Profiles fetch error:', profilesError);
          setError(profilesError.message);
          return;
        }
        
        console.log('Fetched profiles:', profiles);
        console.log('Number of super users found:', profiles?.length || 0);
        
        // Get current user to have at least one email
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Map profiles and add email for current user
        const mappedProfiles = (profiles || []).map(profile => {
          // If this is the current user, we can add their email
          const email = profile.id === currentUser?.id ? currentUser.email : `user-${profile.id.substring(0, 8)}@system.local`;
          
          return {
            ...profile,
            email: email || 'No email available'
          };
        });
        
        // If no profiles found, check if current user is super_user
        if (!profiles || profiles.length === 0) {
          if (currentUser) {
            // Get current user's profile
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
              
            if (currentProfile) {
              console.log('Current user profile:', currentProfile);
              setUsers([{
                ...currentProfile,
                email: currentUser.email || 'No email'
              }]);
              return;
            }
          }
        }
        
        setUsers(mappedProfiles);
      } catch (err) {
        console.error('Unexpected error fetching users:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load users');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower)
      );
    });
  }, [users, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Users"
          subtitle="Manage super admin users"
        />
        <div className="alert alert-error">
          <span>Error loading users: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Users"
        subtitle="Manage super admin users across the system"
        action={
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        }
      />

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="form-control">
            <div className="input-group">
              <span className="bg-base-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Super Admins</div>
            <div className="stat-value text-primary">{users.length}</div>
            <div className="stat-desc">System administrators</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-base-100 shadow-md">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Last Login</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover">
                    <td>
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          user={{
                            first_name: user.first_name,
                            last_name: user.last_name,
                            avatar_url: user.avatar_url
                          }}
                          size="md"
                        />
                        <div>
                          <div className="font-medium">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : 'No name'
                            }
                          </div>
                          <div className="text-sm text-base-content/60">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'} badge-sm`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="badge badge-primary badge-sm">
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">
                        {user.phone || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {user.last_login_at 
                          ? format(new Date(user.last_login_at), 'MMM d, yyyy')
                          : 'Never'
                        }
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </label>
                        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li>
                            <a onClick={() => {
                              setSelectedUser(user);
                              setShowDetailsModal(true);
                            }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </a>
                          </li>
                          <div className="divider my-0"></div>
                          <li>
                            <a onClick={() => {
                              navigator.clipboard.writeText(user.id);
                              showToast({ message: 'User ID copied!', type: 'success' });
                            }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy User ID
                            </a>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="text-base-content/60">
                      {searchTerm 
                        ? "No users found matching your search."
                        : "No super admin users found."
                      }
                    </div>
                    {!searchTerm && (
                      <div className="mt-4">
                        <p className="text-sm text-base-content/50 mb-2">
                          To create super admin users, update the user's role in the database:
                        </p>
                        <div className="mockup-code text-left max-w-md mx-auto">
                          <pre><code>UPDATE profiles SET role = 'super_user' WHERE email = 'user@example.com';</code></pre>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-body border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-base-content/60">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="join">
                <button 
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                <button 
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>
                <button className="join-item btn btn-sm btn-active">
                  Page {currentPage}
                </button>
                <button 
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
                <button 
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">User Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar 
                  user={{
                    first_name: selectedUser.first_name || '',
                    last_name: selectedUser.last_name || '',
                    avatar_url: selectedUser.avatar_url || ''
                  }}
                  size="xl"
                />
                <div>
                  <h4 className="text-xl font-semibold">
                    {selectedUser.first_name && selectedUser.last_name 
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : 'No name provided'
                    }
                  </h4>
                  <p className="text-base-content/70">{selectedUser.email}</p>
                </div>
              </div>

              <div className="divider"></div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">User ID</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono bg-base-200 px-2 py-1 rounded">{selectedUser.id}</p>
                    <button 
                      className="btn btn-xs btn-ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.id);
                        showToast({ message: 'Copied!', type: 'success' });
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Role</span>
                  </label>
                  <div className="badge badge-primary">{selectedUser.role}</div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Status</span>
                  </label>
                  <div className={`badge ${selectedUser.is_active ? 'badge-success' : 'badge-error'}`}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Phone</span>
                  </label>
                  <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Created</span>
                  </label>
                  <p className="text-sm">
                    {selectedUser.created_at 
                      ? format(new Date(selectedUser.created_at), 'MMM d, yyyy h:mm a')
                      : 'Unknown'
                    }
                  </p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Last Login</span>
                  </label>
                  <p className="text-sm">
                    {selectedUser.last_login_at 
                      ? format(new Date(selectedUser.last_login_at), 'MMM d, yyyy h:mm a')
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div 
            className="modal-backdrop"
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedUser(null);
            }}
          ></div>
        </div>
      )}
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default SuperAdmin;