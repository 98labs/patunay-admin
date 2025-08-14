import { LucideIcon } from 'lucide-react';

export interface Links {
  name: string;
  path: string;
  icon?: LucideIcon;
  children?: Links[];
}

export interface NavbarItemProps {
  currentPath: string;
  name: string;
  path: string;
  icon?: LucideIcon;
  childrenLinks?: Links[];
  isChild?: boolean;
  onNavigate?: () => void;
}
