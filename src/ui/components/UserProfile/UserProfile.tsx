import { useEffect, useState } from "react";
import { themeChange } from "theme-change";
import { useSelector } from "react-redux";

import { selectUser } from '../../store/features/auth';
import { UserAvatar } from '@components';
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';
import { USER_ROLES } from '../../typings';

const UserProfile = () => {
  const [currentTheme, setCurrentTheme] = useState("light");
  const legacyUser = useSelector(selectUser);
  const { user: currentUser, currentOrganization, organizations } = useAuth();
  useEffect(() => {
    themeChange(false);
    try {
      let savedTheme = localStorage.getItem("theme");
    
      if (!savedTheme) {
        savedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
    
      localStorage.setItem("theme", savedTheme);
      
      // Set DaisyUI theme
      document.documentElement.setAttribute("data-theme", savedTheme);
      
      // Set Tailwind dark mode class
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      setCurrentTheme(savedTheme);
    } catch (error) {
      console.error("Error initializing themeChange:", error);
    }
  }, []);
  
  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
    
    // Set DaisyUI theme
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Set Tailwind dark mode class
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    setCurrentTheme(newTheme);
  };
    const username = currentUser?.email?.split("@")[0] || legacyUser?.email?.split("@")[0];

  return (
    <div className="px-8 py-8 bg-base-200 dark:bg-base-200 border-b border-base-300 dark:border-base-300">
      <div className="flex items-center gap-4">
        <UserAvatar
          avatarUrl={currentUser?.avatar_url}
          firstName={currentUser?.first_name}
          lastName={currentUser?.last_name}
          email={currentUser?.email || legacyUser?.email}
          size="lg"
          className="ring ring-primary ring-offset-2 ring-offset-base-200 dark:ring-offset-base-200"
        />
        <div className="flex-1">
          <div className="text-base font-semibold text-base-content dark:text-base-content">
            {currentUser?.first_name && currentUser?.last_name 
              ? `${currentUser.first_name} ${currentUser.last_name}`
              : currentUser || legacyUser ? username : "User"
            }
          </div>
          <div className="text-sm text-base-content/70 dark:text-base-content/70">
            {(() => {
              // If super user, always show super user role
              if (currentUser?.role === 'super_user') {
                return USER_ROLES.super_user.label;
              }
              
              // Find the user's role in the current organization
              const currentOrgMembership = organizations.find(
                org => org.organization_id === currentOrganization?.id
              );
              
              const orgRole = currentOrgMembership?.role || currentUser?.role;
              return orgRole ? USER_ROLES[orgRole]?.label : 'User';
            })()}
          </div>
        </div>
        <div className="flex items-center">
          <label className="swap swap-rotate cursor-pointer p-2 rounded-lg hover:bg-base-300 dark:hover:bg-base-300 transition-colors">
            <input
              type="checkbox"
              onChange={toggleTheme}
              checked={currentTheme === "dark"}
              className="sr-only"
            />
            {/* Light icon (sun) */}
            <svg
              className="swap-off fill-current w-6 h-6 text-base-content dark:text-base-content"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>
            {/* Dark icon (moon) */}
            <svg
              className="swap-on fill-current w-6 h-6 text-base-content dark:text-base-content"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
