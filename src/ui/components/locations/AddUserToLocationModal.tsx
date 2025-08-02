import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { FormField, UserAvatar } from '@components';
import { addUserToLocation } from '../../lib/api/locations';
import supabase from '../../supabase';

interface AddUserToLocationModalProps {
  open: boolean;
  onClose: () => void;
  locationId: string;
  organizationId: string;
  onSuccess: () => void;
}

interface AvailableUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  org_role: string;
}

export function AddUserToLocationModal({
  open,
  onClose,
  locationId,
  organizationId,
  onSuccess
}: AddUserToLocationModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'staff' as const,
    department: '',
    position: '',
    employee_id: '',
    is_primary_location: false,
    can_access_other_locations: false
  });

  useEffect(() => {
    if (open) {
      setError(null);
      setSearchTerm('');
      setFormData({
        user_id: '',
        role: 'staff' as const,
        department: '',
        position: '',
        employee_id: '',
        is_primary_location: false,
        can_access_other_locations: false
      });
      loadAvailableUsers();
    }
  }, [open]);

  const loadAvailableUsers = async () => {
    setSearchLoading(true);
    try {
      // Try to use RPC function first, fallback to regular query if it doesn't exist
      let orgUsers = null;
      let orgError = null;
      
      // First try the RPC function
      const rpcResult = await supabase
        .rpc('get_organization_users_with_email', {
          p_organization_id: organizationId
        });
      
      if (rpcResult.error && rpcResult.error.code === '42883') {
        // Function doesn't exist, use fallback query
        const { data: orgUserData, error: fallbackError } = await supabase
          .from('organization_users')
          .select(`
            user_id,
            role,
            profiles!organization_users_user_id_fkey(
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('organization_id', organizationId)
          .eq('is_active', true);
          
        if (fallbackError) {
          console.error('Error loading org users:', fallbackError);
          throw fallbackError;
        }
        
        // Transform the data to match RPC function output
        orgUsers = orgUserData?.map(ou => ({
          user_id: ou.user_id,
          email: `user@example.com`, // Placeholder email
          first_name: ou.profiles?.first_name || '',
          last_name: ou.profiles?.last_name || '',
          avatar_url: ou.profiles?.avatar_url || null,
          role: ou.role
        }));
      } else if (rpcResult.error) {
        console.error('Error loading org users:', rpcResult.error);
        throw rpcResult.error;
      } else {
        orgUsers = rpcResult.data;
      }

      if (!orgUsers || orgUsers.length === 0) {
        setAvailableUsers([]);
        return;
      }

      // Get users already assigned to this location
      const { data: locationUsers } = await supabase
        .from('location_users')
        .select('user_id')
        .eq('location_id', locationId)
        .eq('is_active', true);

      const assignedUserIds = new Set(locationUsers?.map(lu => lu.user_id) || []);
      
      const available = orgUsers
        .filter(user => !assignedUserIds.has(user.user_id))
        .map(user => ({
          id: user.user_id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          avatar_url: user.avatar_url,
          org_role: user.role
        }));

      console.log('Available users:', available);
      setAvailableUsers(available);
    } catch (err) {
      console.error('Failed to load available users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available users');
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase().trim();
    const email = user.email.toLowerCase();
    const search = searchTerm.toLowerCase().trim();
    return search === '' || fullName.includes(search) || email.includes(search);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) {
      setError('Please select a user');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await addUserToLocation({
        location_id: locationId,
        user_id: formData.user_id,
        organization_id: organizationId,
        role: formData.role,
        department: formData.department || null,
        position: formData.position || null,
        employee_id: formData.employee_id || null,
        is_primary_location: formData.is_primary_location,
        can_access_other_locations: formData.can_access_other_locations
      });
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        user_id: '',
        role: 'staff',
        department: '',
        position: '',
        employee_id: '',
        is_primary_location: false,
        can_access_other_locations: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user to location');
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = availableUsers.find(u => u.id === formData.user_id);

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Add User to Location</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Search Users</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/60" />
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Select User <span className="text-error">*</span></span>
            </label>
            {searchLoading ? (
              <div className="flex items-center justify-center p-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : (
              <div className="border border-base-300 rounded-lg max-h-48 overflow-y-auto">
                {availableUsers.length === 0 && !searchLoading ? (
                  <p className="text-sm text-base-content/60 p-4 text-center">
                    No organization users available to add
                  </p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-sm text-base-content/60 p-4 text-center">
                    No users match your search
                  </p>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, user_id: user.id })}
                        className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-base-200 text-left transition-colors ${
                          formData.user_id === user.id ? 'bg-base-200' : ''
                        }`}
                      >
                        <UserAvatar
                          user={{
                            first_name: user.first_name || user.email.split('@')[0],
                            last_name: user.last_name || '',
                            avatar_url: user.avatar_url
                          }}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.first_name || user.last_name ? 
                              `${user.first_name} ${user.last_name}`.trim() : 
                              user.email
                            }
                          </p>
                          {(user.first_name || user.last_name) && user.email && (
                            <p className="text-xs text-base-content/60 truncate">{user.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="alert">
              <div>
                <p className="font-medium">Selected: {
                  selectedUser.first_name || selectedUser.last_name ? 
                    `${selectedUser.first_name} ${selectedUser.last_name}`.trim() : 
                    selectedUser.email
                }</p>
                {(selectedUser.first_name || selectedUser.last_name) && selectedUser.email && (
                  <p className="text-sm">{selectedUser.email}</p>
                )}
              </div>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Role at Location <span className="text-error">*</span></span>
            </label>
            <select
              className="select select-bordered w-full"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Sales"
            />

            <FormField
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Branch Manager"
            />
          </div>

          <FormField
            label="Employee ID"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            placeholder="Optional employee identifier"
          />

          <div className="space-y-4">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">
                  <span className="font-medium">Primary Location</span>
                  <span className="block text-sm text-base-content/60">
                    Set as the user's main work location
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.is_primary_location}
                  onChange={(e) => setFormData({ ...formData, is_primary_location: e.target.checked })}
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">
                  <span className="font-medium">Access Other Locations</span>
                  <span className="block text-sm text-base-content/60">
                    Allow access to other organization locations
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.can_access_other_locations}
                  onChange={(e) => setFormData({ ...formData, can_access_other_locations: e.target.checked })}
                />
              </label>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !formData.user_id}>
              {loading && <span className="loading loading-spinner loading-sm mr-2"></span>}
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}