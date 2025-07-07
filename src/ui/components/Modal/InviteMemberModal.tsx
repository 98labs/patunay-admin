import React from 'react';
import { UserRole } from '../../typings';
import { FormField } from '../FormField';
import { Info } from 'lucide-react';

interface InviteFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  permissions: string[];
  phone: string;
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InviteFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<InviteFormData>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = {
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    permissions: [],
    phone: '',
  },
}) => {
  const [formData, setFormData] = React.useState<InviteFormData>({
    email: initialData.email || '',
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    role: initialData.role || 'viewer',
    permissions: initialData.permissions || [],
    phone: initialData.phone || '',
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        email: initialData.email || '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        role: initialData.role || 'viewer',
        permissions: initialData.permissions || [],
        phone: initialData.phone || '',
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'viewer',
      permissions: [],
      phone: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Invite New Member</h3>
        
        <div className="space-y-4">
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />

            <FormField
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <FormField
            label="Phone (Optional)"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div className="form-control">
            <label className="label">
              <span className="label-text">Role</span>
            </label>
            <select
              className="select select-bordered"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <option value="viewer">Viewer</option>
              <option value="staff">Staff</option>
              <option value="appraiser">Appraiser</option>
              <option value="issuer">Issuer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="alert alert-info">
            <Info className="w-5 h-5" />
            <span className="text-sm">The user will receive an email to set their password and activate their account.</span>
          </div>
        </div>

        <div className="modal-action">
          <button 
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading || !formData.email || !formData.first_name || !formData.last_name}
          >
            {isLoading ? 'Inviting...' : 'Send Invitation'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
};