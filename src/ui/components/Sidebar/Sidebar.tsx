import { UserProfileDropdown, NfcStatusIndicator } from '@components';
import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import { Links, NavbarItemProps } from './types';
import { useMemo, useCallback, createElement } from 'react';
import { Home, Image, ImagePlus, LucideIcon, Search, ShieldUser, Tags, User } from 'lucide-react';

const IconWrapper = ({
  icon: IconComponent,
  ...props
}: {
  icon: LucideIcon;
  [key: string]: unknown;
}) => {
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
};

const NavbarItem = ({
  currentPath,
  icon,
  name,
  path,
  childrenLinks,
  isChild = false,
  onNavigate,
}: NavbarItemProps) => (
  <>
    <Link to={path} onClick={onNavigate}>
      <li
        key={path}
        className={`cursor-pointer overflow-hidden p-4 transition-all duration-300 ease-in-out hover:text-white dark:hover:text-gray-200 ${
          isChild && 'px-8'
        } ${
          currentPath === path
            ? 'bg-primary-100 dark:bg-primary-100 text-white dark:text-white'
            : 'hover:bg-primary-100/20 text-color-neutral-black-02'
        }`}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="flex-shrink-0">
              <IconWrapper icon={icon} size={20} strokeWidth={2} />
            </span>
          )}
          <span>{name}</span>
        </div>
      </li>
    </Link>
    {childrenLinks && (
      <ul>
        {childrenLinks.map((child) => (
          <NavbarItem
            currentPath={currentPath}
            key={child.path}
            name={child.name}
            path={child.path}
            icon={child.icon}
            isChild
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    )}
  </>
);

const Sidebar = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => {
  const pathName = useLocation();

  const {
    canViewArtworks,
    canCreateArtworks,
    canManageAllUsers,
    canManageAllNfcTags,
    canAttachNfcTags,
  } = usePermissions();

  const { isAdmin, user, isLoading } = useAuth();

  const links: Links[] = useMemo(() => {
    const navigationLinks: Links[] = [];

    // Dashboard - always visible to authenticated users
    navigationLinks.push({ name: 'Dashboard', path: '/dashboard', icon: Home });

    // For admin, show everything
    if (user?.role === 'admin') {
      // Artworks section
      navigationLinks.push({
        name: 'Artworks',
        path: '/dashboard/artworks',
        children: [
          { name: 'Register Artwork', path: '/dashboard/artworks/register', icon: ImagePlus },
          { name: 'Search', path: '/dashboard/artworks/search', icon: Search },
        ],
        icon: Image,
      });

      // Admin section
      navigationLinks.push({
        name: 'Admin',
        path: '/dashboard/admin',
        icon: ShieldUser,
        children: [
          { name: 'User Management', path: '/dashboard/admin/users', icon: User },
          { name: 'NFC Tags', path: '/dashboard/admin/nfc-tags', icon: Tags },
        ],
      });

      return navigationLinks;
    }

    // For non-super_user users, use permission-based logic
    // Artworks section - visible if user can view or manage artworks
    if (canViewArtworks || canCreateArtworks) {
      const artworkChildren: Links[] = [];
      if (canCreateArtworks || canAttachNfcTags) {
        artworkChildren.push({ name: 'Register Artwork', path: '/dashboard/artworks/register' });
      }

      if (canViewArtworks) {
        artworkChildren.push({ name: 'Search', path: '/dashboard/artworks/search' });
      }

      navigationLinks.push({
        name: 'Artworks',
        path: '/dashboard/artworks',
        children: artworkChildren.length > 0 ? artworkChildren : undefined,
      });
    }

    // Management section - visible based on permissions
    const managementChildren: Links[] = [];

    // User Management - based on permissions only
    if (canManageAllUsers) {
      managementChildren.push({ name: 'User Management', path: '/dashboard/admin/users' });
    }

    if (canManageAllNfcTags) {
      managementChildren.push({ name: 'NFC Tags', path: '/dashboard/admin/nfc-tags' });
    }

    if (managementChildren.length > 0) {
      // Change section name based on user's primary capabilities
      const hasUserManagement = canManageAllUsers;
      const sectionName = hasUserManagement ? 'Admin' : 'Tools';

      navigationLinks.push({
        name: sectionName,
        path: '/dashboard/admin',
        children: managementChildren,
      });
    }

    return navigationLinks;
  }, [
    canViewArtworks,
    canCreateArtworks,
    canManageAllUsers,
    canManageAllNfcTags,
    canAttachNfcTags,
    isAdmin,
    user,
  ]);

  const handleNavigate = useCallback(() => {
    if (window.innerWidth < 768) setIsOpen(false); // only close on small screens
  }, [setIsOpen]);

  // Show a loading state while auth is initializing
  if (isLoading) {
    return (
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[300px] transform border-0 bg-[var(--color-neutral-gray-01)] transition-transform duration-300 ease-in-out dark:bg-[var(--color-neutral-gray-01)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:flex md:translate-x-0`}
      >
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-0 left-0 z-50 h-full w-[300px] transform border-0 bg-[var(--color-neutral-gray-01)] transition-transform duration-300 ease-in-out dark:bg-[var(--color-neutral-gray-01)] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:flex md:translate-x-0`}
    >
      <div className="flex h-screen w-[300px] flex-col">
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between border-0 px-4 py-8">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <img src="/PatunayLogo.svg" alt="Patunay Logo" className="h-10 w-10" />
            <span className="text-color-neutral-black-02 text-2xl font-semibold">Patunay</span>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="text-color-neutral-black-02 hover:text-primary dark:hover:text-primary md:hidden"
          >
            ✖
          </button>
        </div>

        {/* Scrollable navigation menu */}
        <div className="flex-1 overflow-y-auto">
          <ul className="w-full p-0">
            {links.map(({ name, path, icon, children }) => (
              <NavbarItem
                currentPath={pathName.pathname}
                key={path}
                name={name}
                path={path}
                icon={icon}
                childrenLinks={children}
                onNavigate={handleNavigate}
              />
            ))}
          </ul>
        </div>

        {/* Fixed bottom section */}
        <div className="mt-auto flex-shrink-0">
          <div className="">
            <NfcStatusIndicator compact={false} showRefreshButton={true} />
          </div>

          {/* User Profile dropdown at bottom */}
          <div className="flex-shrink-0 border-0">
            <UserProfileDropdown />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
