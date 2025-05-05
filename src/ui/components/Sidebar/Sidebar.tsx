import { UserProfile } from "@components";
import { Link, useLocation, useNavigate  } from "react-router-dom";
import supabase from "../../supabase";
import { Links, NavbarItemProps } from "./types";
import { useState } from "react";

const NavbarItem = ({
  currentPath,
  name,
  path,
  childrenLinks,
  isChild = false,
  onNavigate
}: NavbarItemProps) => (
  <>
    <Link to={path} onClick={onNavigate}>
      <li
        key={path}
        className={`transition-all duration-300 ease-in-out overflow-hidden py-4 cursor-pointer hover:text-white ${
          isChild ? "px-12" : "px-8"
        } ${
          currentPath === path
            ? "bg-primary-100 text-white"
            : "hover:bg-primary-100 hover:opacity-50"
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
            isChild={true}
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

  const links: Links[] = [
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
        { name: "NFC Tags", path: "/dashboard/admin/nfc-tags" },
        { name: "Team", path: "/dashboard/admin/team" },
        { name: "Devices", path: "/dashboard/admin/devices" },
      ],
    },
  ];

  const handleLogout = async () => {
    const {error} = await supabase.auth.signOut();
    if (error === null) {
      navigate('/login');
    }
  };

  const handleNavigate = () => {
    if (window.innerWidth < 768) setIsOpen(false); // only close on small screens
  };

  return (
    <div
      className={`fixed z-50 top-0 left-0 h-full w-[300px] bg-neutral-gray-01 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 md:flex`}
    >
      <div className="flex flex-col w-[300px] h-screen">
        {/* Close button on mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden self-end m-4"
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
          <button
            onClick={handleLogout}
            className="w-full hover:bg-primary-100 hover:opacity-50 hover:text-white px-3 py-2 rounded mt-4"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
