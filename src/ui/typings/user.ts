export type UserRole = 'admin' | 'issuer' | 'appraiser' | 'staff' | 'viewer';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  email_confirmed_at?: string;
  permissions?: string[];
}


export interface CreateUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  phone?: string;
  permissions?: string[];
}


export interface UpdateUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
  phone?: string;
  avatar_url?: string;
}


export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_activity_at: string;
}

export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
}


export const USER_ROLES: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: 'Administrator',
    description: 'Full system access - manage users, artworks, and settings',
  },
  issuer: {
    label: 'Issuer',
    description: 'NFC tag issuer - manage NFC tags and attach to artworks',
  },
  appraiser: {
    label: 'Appraiser',
    description: 'Artwork appraiser - add and manage appraisal information',
  },
  staff: {
    label: 'Staff',
    description: 'Staff - manage artwork records but cannot issue NFC tags',
  },
  viewer: {
    label: 'Viewer',
    description: 'Basic access - view artwork information (excluding appraisal details)',
  },
};


export const DEFAULT_PERMISSIONS = {
  admin: [
    'manage_all_users',
    'manage_users',
    'manage_all_artworks',
    'manage_artworks',
    'manage_all_nfc_tags',
    'manage_nfc_tags',
    'view_all_statistics',
    'view_statistics',
    'manage_system',
    'manage_settings',
    'manage_all_appraisals',
    'manage_appraisals',
    'manage_all_locations',
    'manage_locations',
    'view_all_locations',
    'access_all_locations',
  ],
  issuer: [
    'attach_nfc_tags',
    'view_own_artworks',
    'create_artworks',
  ],
  appraiser: [
    'view_artworks',
    'create_appraisals',
    'update_appraisals',
    'view_artwork_details',
  ],
  staff: [
    'manage_artworks',
    'view_artworks',
    'view_statistics',
  ],
  viewer: [
    'view_artworks',
    'view_public_statistics',
  ],
} as const;

export const PERMISSION_DESCRIPTIONS = {
  // Super User permissions
  manage_all_users: 'Manage all users',
  manage_all_artworks: 'Manage all artworks',
  manage_all_nfc_tags: 'Manage all NFC tags',
  view_all_statistics: 'View all statistics',
  manage_system: 'Access system-wide settings and configuration',
  manage_all_appraisals: 'Manage all appraisals',
  
  // Admin permissions
  manage_users: 'Manage users',
  manage_artworks: 'Manage artworks',
  manage_nfc_tags: 'Manage NFC tags',
  view_statistics: 'View statistics',
  manage_settings: 'Manage settings',
  manage_appraisals: 'Manage appraisals',
  
  // Issuer permissions
  attach_nfc_tags: 'Attach NFC tags to artworks',
  view_own_artworks: 'View artworks they have access to',
  create_artworks: 'Create new artwork records',
  
  // Appraiser permissions
  create_appraisals: 'Create appraisal records',
  update_appraisals: 'Update existing appraisal records',
  view_artwork_details: 'View detailed artwork information',
  
  // Staff permissions
  view_artworks: 'View artwork information',
  
  // Viewer permissions
  view_public_statistics: 'View public statistics',
  
  // Location permissions
  manage_all_locations: 'Manage all locations',
  manage_locations: 'Create, update, and delete locations',
  view_all_locations: 'View all locations',
  access_all_locations: 'Access data from all locations',
} as const;

// Permission categories for better organization
export const PERMISSION_CATEGORIES = {
  users: 'User Management',
  locations: 'Location Management',
  artworks: 'Artwork Management',
  nfc_tags: 'NFC Tags',
  appraisals: 'Appraisals',
  system: 'System & Statistics',
} as const;

export type PermissionCategory = keyof typeof PERMISSION_CATEGORIES;