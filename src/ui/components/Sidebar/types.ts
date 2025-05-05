export interface Links {
    name: string;
    path: string;
    children?: Links[];
  }
  
  export interface NavbarItemProps {
    currentPath: string;
    name: string;
    path: string;
    childrenLinks?: Links[];
    isChild?: boolean;
    onNavigate?: () => void;
  }
  