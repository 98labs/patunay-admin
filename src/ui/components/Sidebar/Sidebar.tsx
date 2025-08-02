import { UserProfile, NfcStatusIndicator, OrganizationSwitcher } from "@components";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../../store/api/userApi";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';
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
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const {
    canViewArtworks,
    canCreateArtworks,
    canManageOrgUsers,
    canManageAllUsers,
    canManageOrgNfcTags,
    canManageAllNfcTags,
    canManageOrganizations,
    canViewOrgStatistics,
    canViewAllStatistics,
    canAttachNfcTags,
    canCreateAppraisals,
    canManageOrgSettings,
  } = usePermissions();

  const { isSuperUser, isAdmin, isAppraiser, currentOrganization, user, organizations, isLoading } = useAuth();


  const links: Links[] = useMemo(() => {
    const navigationLinks: Links[] = [];

    // Dashboard - always visible to authenticated users
    navigationLinks.push({ name: "Dashboard", path: "/dashboard" });

    // Artworks section - visible if user can view or manage artworks
    // For super users, always show artworks section
    if (canViewArtworks || canCreateArtworks || user?.role === 'super_user') {
      const artworkChildren: Links[] = [];
      if (canCreateArtworks || canAttachNfcTags || user?.role === 'super_user') {
        artworkChildren.push({ name: "Register Artwork", path: "/dashboard/artworks/register" });
      }
      
      if (canViewArtworks || user?.role === 'super_user') {
        artworkChildren.push({ name: "Search", path: "/dashboard/artworks/search" });
      }

      navigationLinks.push({
        name: "Artworks",
        path: "/dashboard/artworks",
        children: artworkChildren.length > 0 ? artworkChildren : undefined,
      });
    }

    // Appraisals section - visible to appraisers and those who can manage appraisals
    // Check if user is appraiser in primary role or any organization
    const isPrimaryAppraiser = user?.role === 'appraiser';
    const isOrgAppraiser = organizations.some(org => org.role === 'appraiser');
    const hasAppraiserAccess = isPrimaryAppraiser || isOrgAppraiser || isAppraiser || canCreateAppraisals;
    
    if (hasAppraiserAccess) {
      navigationLinks.push({
        name: "Appraisals",
        path: "/dashboard/appraisals",
      });
    }

    // Management section - visible based on permissions
    const managementChildren: Links[] = [];
    
    // User Management - based on permissions only
    if (canManageOrgUsers || canManageAllUsers || user?.role === 'super_user') {
      managementChildren.push({ name: "User Management", path: "/dashboard/admin/users" });
    }
    
    if (canManageOrgNfcTags || canManageAllNfcTags || user?.role === 'super_user') {
      managementChildren.push({ name: "NFC Tags", path: "/dashboard/admin/nfc-tags" });
    }
    
    if (canManageOrgNfcTags || canManageAllNfcTags || user?.role === 'super_user') {
      managementChildren.push({ name: "Devices", path: "/dashboard/admin/device" });
    }

    if (managementChildren.length > 0) {
      // Change section name based on user's primary capabilities
      const hasUserManagement = canManageOrgUsers || canManageAllUsers;
      const sectionName = hasUserManagement ? "Admin" : "Tools";
      
      navigationLinks.push({
        name: sectionName,
        path: "/dashboard/admin",
        children: managementChildren,
      });
    }

    // Super User section - only visible to super users
    if (isSuperUser || user?.role === 'super_user') {
      const superUserChildren: Links[] = [];
      
      // For super users, always show these options even if permissions aren't loaded yet
      if (canManageOrganizations || user?.role === 'super_user') {
        superUserChildren.push({ name: "Organizations", path: "/dashboard/super-admin/organizations" });
      }
      
      if (canManageAllUsers || user?.role === 'super_user') {
        superUserChildren.push({ name: "System Users", path: "/dashboard/super-admin/users" });
      }
      
      if (canViewAllStatistics || user?.role === 'super_user') {
        superUserChildren.push({ name: "System Statistics", path: "/dashboard/super-admin/statistics" });
      }

      if (superUserChildren.length > 0) {
        navigationLinks.push({
          name: "Super Admin",
          path: "/dashboard/super-admin",
          children: superUserChildren,
        });
      }
    }

    // Organization Management - visible to organization admins and super users
    if (currentOrganization && (isAdmin || isSuperUser) && (canManageOrgUsers || canViewOrgStatistics || canManageOrgSettings)) {
      const orgChildren: Links[] = [];
      
      if (canManageOrgUsers) {
        orgChildren.push({ name: "Members", path: "/dashboard/organization/members" });
      }
      
      // Add Locations to organization menu
      if (canManageOrgUsers || canManageOrgSettings) {
        orgChildren.push({ name: "Locations", path: "/dashboard/organization/locations" });
      }
      
      if (canViewOrgStatistics) {
        orgChildren.push({ name: "Statistics", path: "/dashboard/organization/statistics" });
      }
      
      if (canManageOrgSettings) {
        orgChildren.push({ name: "Settings", path: "/dashboard/organization/settings" });
      }

      if (orgChildren.length > 0) {
        navigationLinks.push({
          name: "Organization",
          path: "/dashboard/organization",
          children: orgChildren,
        });
      }
    }

    return navigationLinks;
  }, [
    canViewArtworks,
    canCreateArtworks,
    canManageOrgUsers,
    canManageAllUsers,
    canManageOrgNfcTags,
    canManageAllNfcTags,
    canManageOrganizations,
    canViewOrgStatistics,
    canViewAllStatistics,
    canAttachNfcTags,
    canCreateAppraisals,
    canManageOrgSettings,
    isSuperUser,
    isAdmin,
    isAppraiser,
    currentOrganization,
    user,
    organizations,
  ]);

  const handleLogout = useCallback(async () => {
    try {
      await logout().unwrap();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/login");
    }
  }, [logout, navigate]);

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
        {/* Close button on mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden self-end m-4 text-base-content dark:text-base-content hover:text-primary dark:hover:text-primary"
        >
          ✖
        </button>
        
        {/* Organization Switcher */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-base-300 dark:border-base-300">
          <OrganizationSwitcher className="w-full" />
        </div>
        
        <div className="flex-shrink-0">
          <UserProfile />
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
          <button
            onClick={handleLogout}
            className="w-full hover:bg-primary/20 dark:hover:bg-primary/30 hover:text-primary dark:hover:text-primary text-base-content dark:text-base-content px-3 py-2 rounded mt-4 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
