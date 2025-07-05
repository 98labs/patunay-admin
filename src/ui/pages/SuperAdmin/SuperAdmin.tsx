import React, { useState, useEffect } from "react";
import { PageHeader, Loading, UserAvatar } from "@components";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabase";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { isSuperUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Component is now protected by route, no need to check here

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
          const email = profile.id === currentUser?.id ? currentUser.email : `User ${profile.first_name || profile.id}`;
          
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
  
  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>Error loading users: {error}</span>
        </div>
      </div>
    );
  }

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Users"
        subtitle="Manage super admin users across the system"
      />

      {/* Search Bar */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Search Users</span>
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-base-content/70">
          Showing {filteredUsers.length} of {users.length} super admin users
        </div>
        {users.length === 0 && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        )}
      </div>

      {/* User Cards Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <UserAvatar 
                    user={{
                      first_name: user.first_name || '',
                      last_name: user.last_name || '',
                      avatar_url: user.avatar_url || ''
                    }}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.email || 'Unknown User'
                      }
                    </h3>
                    <p className="text-sm text-base-content/70 truncate">{user.email || 'No email'}</p>
                    
                    <div className="mt-3 space-y-1">
                      <div className="badge badge-primary badge-sm">
                        {user.role || 'super_user'}
                      </div>
                      
                      {user.is_active ? (
                        <div className="badge badge-success badge-sm">Active</div>
                      ) : (
                        <div className="badge badge-error badge-sm">Inactive</div>
                      )}
                    </div>

                    {user.created_at && (
                      <div className="mt-3 text-xs text-base-content/60">
                        <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-4">
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-sm btn-ghost">
                      Actions
                    </label>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <a onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </a>
                      </li>
                      <li>
                        <a onClick={() => {
                          navigator.clipboard.writeText(user.id);
                          // Show a toast notification instead of alert
                          const toast = document.createElement('div');
                          toast.className = 'toast toast-top toast-end';
                          toast.innerHTML = `
                            <div class="alert alert-success">
                              <span>User ID copied!</span>
                            </div>
                          `;
                          document.body.appendChild(toast);
                          setTimeout(() => toast.remove(), 2000);
                        }}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy User ID
                        </a>
                      </li>
                      {user.email && user.email !== 'No email available' && (
                        <li>
                          <a onClick={() => {
                            navigator.clipboard.writeText(user.email);
                            // Show a toast notification instead of alert
                            const toast = document.createElement('div');
                            toast.className = 'toast toast-top toast-end';
                            toast.innerHTML = `
                              <div class="alert alert-success">
                                <span>Email copied!</span>
                              </div>
                            `;
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 2000);
                          }}>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Copy Email
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center py-12">
            <p className="text-base-content/70">
              {searchTerm 
                ? "No super admin users found matching your search."
                : "No super admin users found in the system."
              }
            </p>
            {!searchTerm && (
              <div className="mt-4">
                <p className="text-sm text-base-content/60 mb-4">
                  To create super admin users, you need to update the user's role in the database.
                </p>
                <div className="mockup-code text-left max-w-md mx-auto">
                  <pre><code>UPDATE profiles</code></pre>
                  <pre><code>SET role = 'super_user'</code></pre>
                  <pre><code>WHERE email = 'user@example.com';</code></pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                    <p className="text-sm font-mono">{selectedUser.id}</p>
                    <button 
                      className="btn btn-xs btn-ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.id);
                      }}
                    >
                      Copy
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
                      ? new Date(selectedUser.created_at).toLocaleDateString()
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
                      ? new Date(selectedUser.last_login_at).toLocaleDateString()
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
    </div>
  );
};

export default SuperAdmin;