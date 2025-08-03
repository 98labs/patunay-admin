import { UserProfileDropdown, NfcStatusIndicator } from "@components";
import { Link, useLocation } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from '../../hooks/useAuth';
import { Links, NavbarItemProps } from "./types";
import { useMemo, useCallback } from "react";

const NavbarItem = ({
  currentPath,
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
        className={`transition-all duration-300 ease-in-out overflow-hidden py-4 cursor-pointer hover:text-white dark:hover:text-gray-200 ${
          isChild ? "px-12" : "px-8"
        } ${
          currentPath === path
            ? "bg-primary text-white dark:bg-primary dark:text-white"
            : "hover:bg-primary/20 dark:hover:bg-primary/30 text-base-content dark:text-base-content"
        }`}
      >
        {name}
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
    navigationLinks.push({ name: "Dashboard", path: "/dashboard" });

    // For admin, show everything
    if (user?.role === 'admin') {
      // Artworks section
      navigationLinks.push({
        name: "Artworks",
        path: "/dashboard/artworks",
        children: [
          { name: "Register Artwork", path: "/dashboard/artworks/register" },
          { name: "Search", path: "/dashboard/artworks/search" }
        ],
      });


      // Admin section
      navigationLinks.push({
        name: "Admin",
        path: "/dashboard/admin",
        children: [
          { name: "User Management", path: "/dashboard/admin/users" },
          { name: "NFC Tags", path: "/dashboard/admin/nfc-tags" }
        ],
      });



      return navigationLinks;
    }

    // For non-super_user users, use permission-based logic
    // Artworks section - visible if user can view or manage artworks
    if (canViewArtworks || canCreateArtworks) {
      const artworkChildren: Links[] = [];
      if (canCreateArtworks || canAttachNfcTags) {
        artworkChildren.push({ name: "Register Artwork", path: "/dashboard/artworks/register" });
      }
      
      if (canViewArtworks) {
        artworkChildren.push({ name: "Search", path: "/dashboard/artworks/search" });
      }

      navigationLinks.push({
        name: "Artworks",
        path: "/dashboard/artworks",
        children: artworkChildren.length > 0 ? artworkChildren : undefined,
      });
    }


    // Management section - visible based on permissions
    const managementChildren: Links[] = [];
    
    // User Management - based on permissions only
    if (canManageAllUsers) {
      managementChildren.push({ name: "User Management", path: "/dashboard/admin/users" });
    }
    
    if (canManageAllNfcTags) {
      managementChildren.push({ name: "NFC Tags", path: "/dashboard/admin/nfc-tags" });
    }

    if (managementChildren.length > 0) {
      // Change section name based on user's primary capabilities
      const hasUserManagement = canManageAllUsers;
      const sectionName = hasUserManagement ? "Admin" : "Tools";
      
      navigationLinks.push({
        name: sectionName,
        path: "/dashboard/admin",
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
        className={`fixed z-50 top-0 left-0 h-full w-[300px] bg-base-200 dark:bg-base-200 border-r border-base-300 dark:border-base-300 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:flex`}
      >
        <div className="flex items-center justify-center w-full h-full">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 top-0 left-0 h-full w-[300px] bg-base-200 dark:bg-base-200 border-r border-base-300 dark:border-base-300 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 md:flex`}
    >
      <div className="flex flex-col w-[300px] h-screen">
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 dark:border-base-300">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <img 
              src="/PatunayLogo.svg" 
              alt="Patunay Logo" 
              className="w-10 h-10"
            />
            <span className="text-xl font-semibold text-base-content dark:text-base-content">
              Patunay
            </span>
          </div>
          
          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-base-content dark:text-base-content hover:text-primary dark:hover:text-primary"
          >
            ✖
          </button>
        </div>

        {/* Scrollable navigation menu */}
        <div className="flex-1 overflow-y-auto">
          <ul className="w-full p-0">
            {links.map(({ name, path, children }) => (
              <NavbarItem
                currentPath={pathName.pathname}
                key={path}
                name={name}
                path={path}
                childrenLinks={children}
                onNavigate={handleNavigate}
              />
            ))}
          </ul>
        </div>

        {/* Fixed bottom section */}
        <div className="flex-shrink-0 mt-auto">
          <div className="px-4 py-3 border-t border-base-300 dark:border-base-300">
            <NfcStatusIndicator compact={false} showRefreshButton={true} />
          </div>
          
          {/* User Profile dropdown at bottom */}
          <div className="flex-shrink-0 border-t border-base-300 dark:border-base-300">
            <UserProfileDropdown />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
