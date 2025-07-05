import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export const RefreshUserData: React.FC = () => {
  const { user } = useAuth();

  const handleRefresh = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Reload the page to refetch all data
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleRefresh}
        className="btn btn-sm btn-primary"
      >
        🔄 Refresh User Data
      </button>
      {user && (
        <div className="text-xs mt-1 text-right">
          Role: {user.role}
        </div>
      )}
    </div>
  );
};