import { UserProfile } from "@components";
import { Link, useLocation } from "react-router-dom";

interface Links {
  name: string;
  path: string;
  children?: Links[];
}

interface NavbarItemProps {
  currentPath: string;
  name: string;
  path: string;
  childrenLinks?: Links[];
  isChild?: boolean;
}

const NavbarItem = ({
  currentPath,
  name,
  path,
  childrenLinks,
  isChild = false,
}: NavbarItemProps) => (
  <>
    <Link to={path}>
      <li
        key={path}
        className={`transition-all duration-300 ease-in-out overflow-hidden py-4 cursor-pointer hover:text-white ${isChild ? "px-8" : "px-4"} ${currentPath === path ? "bg-primary-100 text-white" : " hover:bg-primary-100 hover:opacity-50"}`}
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
          />
        ))}
      </ul>
    )}
  </>
);

const Sidebar = () => {
  const pathName = useLocation();

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

  return (
    <div className="flex flex-col w-[300px] h-screen bg-neutral-gray-01">
      <UserProfile />

      <ul className="w-full p-0">
        {links.map(({ name, path, children }) => (
          <NavbarItem
            currentPath={pathName.pathname}
            key={path}
            name={name}
            path={path}
            childrenLinks={children}
          />
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
