import { UserProfile, NfcStatusIndicator } from "@components";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../../store/api/userApi";
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

  const links: Links[] = useMemo(() => [
    { name: "Dashboard", path: "/dashboard" },
    {
      name: "Artworks",
      path: "/dashboard/artworks",
      children: [
        { name: "Register Artwork", path: "/dashboard/artworks/register" },
        { name: "Search", path: "/dashboard/artworks/search" },
      ],
    },
    {
      name: "Admin",
      path: "/dashboard/admin",
      children: [
        { name: "User Management", path: "/dashboard/admin/users" },
        { name: "NFC Tags", path: "/dashboard/admin/nfc-tags" },
        { name: "Devices", path: "/dashboard/admin/device" },
      ],
    },
  ], []);

  const handleLogout = useCallback(async () => {
    try {
      await logout().unwrap();
      navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
      navigate("/login");
    }
  }, [logout, navigate]);

  const handleNavigate = useCallback(() => {
    if (window.innerWidth < 768) setIsOpen(false); // only close on small screens
  }, [setIsOpen]);

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
        <UserProfile />

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

        <div className="mt-auto">
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
