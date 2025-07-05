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
                          console.log('View user details:', user.id);
                          // For now, just show user info in console
                          alert(`User Details:\n\nID: ${user.id}\nName: ${user.first_name} ${user.last_name}\nEmail: ${user.email}\nRole: ${user.role}\nActive: ${user.is_active ? 'Yes' : 'No'}`);
                        }}>
                          View Details
                        </a>
                      </li>
                      <li>
                        <a onClick={() => {
                          navigator.clipboard.writeText(user.id);
                          alert('User ID copied to clipboard!');
                        }}>
                          Copy User ID
                        </a>
                      </li>
                      {user.email && user.email !== 'No email available' && (
                        <li>
                          <a onClick={() => {
                            navigator.clipboard.writeText(user.email);
                            alert('Email copied to clipboard!');
                          }}>
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
    </div>
  );
};

export default SuperAdmin;