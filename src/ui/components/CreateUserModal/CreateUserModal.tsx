import { useState } from 'react';
import { Modal } from '@components';
import supabase from '../../supabase';
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'signup' | 'profile'>('signup');
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization, isSuperUser } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Use regular signUp instead of admin API
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: formData.get('firstName') as string,
            last_name: formData.get('lastName') as string,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('No user data returned');

      setUserId(data.user.id);
      setEmail(email);
      setStep('profile');
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      // Manually insert profile
      const userRole = formData.get('role') as string || 'staff';
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: formData.get('firstName') as string,
          last_name: formData.get('lastName') as string,
          role: userRole,
          phone: formData.get('phone') as string,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Add user to organization if not super user
      if (!isSuperUser && currentOrganization?.id) {
        try {
          const { error: orgError } = await supabase
            .rpc('add_user_to_organization', {
              p_user_id: userId,
              p_organization_id: currentOrganization.id,
              p_role: userRole,
              p_permissions: [],
              p_is_primary: true
            });
          
          if (orgError) {
            console.error('Failed to add user to organization:', orgError);
          }
        } catch (error) {
          console.error('Error adding user to organization:', error);
        }
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('signup');
    setUserId('');
    setEmail('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Create User (Workaround Mode)
        </h2>
        
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {step === 'signup' ? (
          <form onSubmit={handleSignUp}>
            <div className="space-y-4">
              <div className="alert alert-info">
                <span>Using alternative signup method due to admin API issues</span>
              </div>
              
              <div className="form-control">
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input input-bordered"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="input input-bordered"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-control">
                <label className="label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="input input-bordered"
                />
              </div>
              
              <div className="form-control">
                <label className="label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="input input-bordered"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Auth User'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateProfile}>
            <div className="space-y-4">
              <div className="alert alert-success">
                <span>Auth user created! Now creating profile...</span>
              </div>
              
              <p className="text-sm">
                User ID: {userId}<br />
                Email: {email}
              </p>
              
              <div className="form-control">
                <label className="label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="input input-bordered"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="input input-bordered"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">Role</label>
                <select name="role" className="select select-bordered">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="appraiser">Appraiser</option>
                </select>
              </div>
              
              <div className="form-control">
                <label className="label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="input input-bordered"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClose}
              >
                Skip Profile
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};