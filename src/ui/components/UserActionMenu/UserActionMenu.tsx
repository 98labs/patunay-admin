import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../typings';

interface UserActionMenuProps {
  user: User;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onToggleUserStatus: (user: User) => void;
  onDeleteUser: (user: User) => void;
  disabled?: boolean;
}

const UserActionMenu: React.FC<UserActionMenuProps> = ({
  user,
  onViewUser,
  onEditUser,
  onToggleUserStatus,
  onDeleteUser,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="dropdown dropdown-end" ref={menuRef}>
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-xs"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
      </div>
      
      {isOpen && (
        <ul className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300">
          <li>
            <button
              onClick={() => handleAction(() => onViewUser(user))}
              className="flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>
          </li>
          
          <li>
            <button
              onClick={() => handleAction(() => onEditUser(user))}
              className="flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit User
            </button>
          </li>
          
          <div className="divider my-1"></div>
          
          <li>
            <button
              onClick={() => handleAction(() => onToggleUserStatus(user))}
              className={`flex items-center gap-2 text-sm ${user.is_active ? 'text-warning' : 'text-success'}`}
            >
              {user.is_active ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Deactivate User
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activate User
                </>
              )}
            </button>
          </li>
          
          <div className="divider my-1"></div>
          
          <li>
            <button
              onClick={() => handleAction(() => onDeleteUser(user))}
              className="flex items-center gap-2 text-sm text-error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete User
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default UserActionMenu;