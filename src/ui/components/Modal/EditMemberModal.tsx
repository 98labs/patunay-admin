import React from 'react';
import { UserRole } from '../../typings';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (role: UserRole) => void;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
  } | null;
  defaultPermissions: Record<UserRole, string[]>;
  isLoading?: boolean;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  defaultPermissions,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(member?.role || 'viewer');

  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = () => {
    onSubmit(selectedRole);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Edit Member Role</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-base-content/60">Member</p>
            <p className="font-medium">{member.first_name} {member.last_name}</p>
            <p className="text-sm text-base-content/60">{member.email}</p>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Role</span>
            </label>
            <select
              className="select select-bordered"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            >
              <option value="viewer">Viewer</option>
              <option value="staff">Staff</option>
              <option value="appraiser">Appraiser</option>
              <option value="issuer">Issuer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Default Permissions for Role</p>
            <div className="flex flex-wrap gap-2">
              {(defaultPermissions[selectedRole] || []).map((perm, idx) => (
                <span key={idx} className="badge badge-sm">{perm}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button 
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Role'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};