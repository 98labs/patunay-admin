import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Organization } from '../../typings';

interface OrganizationSwitcherProps {
  className?: string;
  showCreateNew?: boolean;
  onCreateNew?: () => void;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  className = '',
  showCreateNew = false,
  onCreateNew
}) => {
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization, 
    isSuperUser 
  } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleSwitchOrganization = (organizationId: string) => {
    switchOrganization(organizationId);
    setIsOpen(false);
  };

  if (organizations.length <= 1 && !isSuperUser) {
    return (
      <div className={`text-sm text-base-content/60 ${className}`}>
        {currentOrganization?.name || 'No Organization'}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-sm flex items-center space-x-2 text-sm"
      >
        <div className="flex flex-col items-start">
          <span className="font-medium">
            {currentOrganization?.name || 'Select Organization'}
          </span>
          {currentOrganization?.type && (
            <span className="text-xs text-base-content/50 capitalize">
              {currentOrganization.type.replace('_', ' ')}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-72 bg-base-100 border border-base-300 rounded-md shadow-lg">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-base-content/50 uppercase tracking-wide border-b border-base-200">
                Your Organizations
              </div>
              
              {organizations.map((orgUser) => (
                <button
                  key={orgUser.organization_id}
                  onClick={() => handleSwitchOrganization(orgUser.organization_id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base-200 flex items-center justify-between ${
                    currentOrganization?.id === orgUser.organization_id 
                      ? 'bg-primary/10 text-primary' 
                      : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {orgUser.organization?.name}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-base-content/50">
                      <span className="capitalize">
                        {orgUser.organization?.type?.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-medium">
                        {orgUser.role.replace('_', ' ')}
                      </span>
                      {orgUser.is_primary && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-medium">Primary</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {currentOrganization?.id === orgUser.organization_id && (
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              
              {showCreateNew && onCreateNew && isSuperUser && (
                <>
                  <div className="border-t border-base-200 my-1" />
                  <button
                    onClick={() => {
                      onCreateNew();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create New Organization</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};