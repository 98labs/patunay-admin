import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronUp, User, LogOut, Sun, Moon } from "lucide-react";
import { themeChange } from "theme-change";

import { selectUser } from '../../store/features/auth';
import { UserAvatar } from '@components';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from "../../store/api/userApi";
import { USER_ROLES } from '../../typings';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("light");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  
  const legacyUser = useSelector(selectUser);
  const { user: currentUser } = useAuth();
  
  const username = currentUser?.email?.split("@")[0] || legacyUser?.email?.split("@")[0];

  // Initialize theme
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
      console.error("Error initializing theme:", error);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/login");
    }
  };

  const handleAccount = () => {
    navigate("/dashboard/account");
    setIsOpen(false);
  };

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-300 dark:hover:bg-base-300 transition-colors duration-200"
      >
        <UserAvatar
          avatarUrl={currentUser?.avatar_url}
          firstName={currentUser?.first_name}
          lastName={currentUser?.last_name}
          email={currentUser?.email || legacyUser?.email}
          size="md"
          className="ring ring-primary ring-offset-2 ring-offset-base-200 dark:ring-offset-base-200"
        />
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-base-content dark:text-base-content">
            {currentUser?.first_name && currentUser?.last_name 
              ? `${currentUser.first_name} ${currentUser.last_name}`
              : currentUser || legacyUser ? username : "User"
            }
          </div>
          <div className="text-xs text-base-content/70 dark:text-base-content/70">
            {currentUser?.role ? USER_ROLES[currentUser.role]?.label : 'User'}
          </div>
        </div>
        <ChevronUp 
          className={`w-4 h-4 text-base-content/70 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-base-100 dark:bg-base-100 border border-base-300 dark:border-base-300 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleAccount}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 dark:hover:bg-base-200 transition-colors duration-200 text-left"
          >
            <User className="w-4 h-4 text-base-content/70" />
            <span className="text-sm text-base-content dark:text-base-content">Account</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 dark:hover:bg-base-200 transition-colors duration-200 text-left"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-base-content/70" />
            ) : (
              <Moon className="w-4 h-4 text-base-content/70" />
            )}
            <span className="text-sm text-base-content dark:text-base-content">
              {currentTheme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-base-200 dark:hover:bg-base-200 transition-colors duration-200 text-left border-t border-base-300 dark:border-base-300"
          >
            <LogOut className="w-4 h-4 text-base-content/70" />
            <span className="text-sm text-base-content dark:text-base-content">Log out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;