import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronUp, User, LogOut, Sun, Moon } from 'lucide-react';
import { themeChange } from 'theme-change';

import { selectUser } from '../../store/features/auth';
import { UserAvatar } from '@components';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from '../../store/api/userApi';
import { USER_ROLES } from '../../typings';

interface UserProfileDropdownProps {
  minimized?: boolean;
}

const UserProfileDropdown = ({ minimized = false }: UserProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const legacyUser = useSelector(selectUser);
  const { user: currentUser } = useAuth();

  const username = currentUser?.email?.split('@')[0] || legacyUser?.email?.split('@')[0];

  // Initialize theme
  useEffect(() => {
    themeChange(false);
    try {
      let savedTheme = localStorage.getItem('theme');

      if (!savedTheme) {
        savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      localStorage.setItem('theme', savedTheme);

      // Set DaisyUI theme
      document.documentElement.setAttribute('data-theme', savedTheme);

      // Set Tailwind dark mode class
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setCurrentTheme(savedTheme);
    } catch (error) {
      console.error('Error initializing theme:', error);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleAccount = () => {
    navigate('/dashboard/account');
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
    // Small delay to trigger the opacity animation
    setTimeout(() => setIsVisible(true), 10);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); // Match the animation duration
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }

    // Set DaisyUI theme
    document.documentElement.setAttribute('data-theme', newTheme);

    // Set Tailwind dark mode class
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setCurrentTheme(newTheme);
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dropdown trigger */}
      <button
        className={`hover:bg-primary-100/10 flex w-full items-center transition-colors duration-200 ${minimized ? 'justify-center p-2' : 'gap-2 p-4'}`}
      >
        <UserAvatar
          avatarUrl={currentUser?.avatar_url}
          firstName={currentUser?.first_name}
          lastName={currentUser?.last_name}
          email={currentUser?.email || legacyUser?.email}
          size="md"
        />
        {!minimized && (
          <>
            <div className="flex-1 text-left">
              <div className="text-base-content dark:text-base-content text-sm font-semibold">
                {currentUser?.first_name && currentUser?.last_name
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : currentUser || legacyUser
                    ? username
                    : 'User'}
              </div>
              <div className="text-xs text-[var(--color-neutral-black-02)] dark:text-[var(--color-neutral-black-02)]">
                {currentUser?.role ? USER_ROLES[currentUser.role]?.label : 'User'}
              </div>
            </div>
            <ChevronUp className="h-4 w-4 text-[var(--color-neutral-black-02)] transition-transform duration-200" />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`bg-base-100 dark:bg-base-100 absolute right-2 bottom-full left-2 transform overflow-hidden rounded-2xl shadow-lg transition-all duration-200 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <button
            onClick={handleAccount}
            className={`hover:bg-base-200 dark:hover:bg-base-200 flex w-full cursor-pointer items-center transition-colors duration-200 ${
              minimized ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-left'
            }`}
          >
            <User className="h-4 w-4 text-[var(--color-neutral-black-02)]" />
            {!minimized && (
              <span className="text-base-content dark:text-base-content text-sm">Account</span>
            )}
          </button>
          <button
            onClick={toggleTheme}
            className={`hover:bg-base-200 dark:hover:bg-base-200 flex w-full cursor-pointer items-center transition-colors duration-200 ${
              minimized ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-left'
            }`}
          >
            {currentTheme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--color-neutral-black-02)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--color-neutral-black-02)]" />
            )}
            {!minimized && (
              <span className="text-base-content dark:text-base-content text-sm">
                {currentTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`flex w-full cursor-pointer items-center bg-[var(--color-tertiary-red-200)]/50 transition-colors duration-200 hover:bg-[var(--color-tertiary-red-200)] ${
              minimized ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-left'
            }`}
          >
            <LogOut className="h-4 w-4 text-[var(--color-tertiary-red-400)]" />
            {!minimized && (
              <span className="dark:text-base-content text-sm text-[var(--color-tertiary-red-400)]">
                Log out
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
