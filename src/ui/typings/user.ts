export type UserRole = 'admin' | 'staff';

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
    description: 'Full access to all features and user management',
  },
  staff: {
    label: 'Staff',
    description: 'Limited access to artwork management features',
  },
};

export const DEFAULT_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_artworks',
    'manage_nfc_tags',
    'view_statistics',
    'manage_system',
    'manage_appraisals',
  ],
  staff: [
    'manage_artworks',
    'manage_appraisals',
    'view_statistics',
  ],
} as const;

export const PERMISSION_DESCRIPTIONS = {
  manage_users: 'Create, update, and delete user accounts',
  manage_artworks: 'Create, update, and delete artworks',
  manage_nfc_tags: 'Manage NFC tag assignments and settings',
  view_statistics: 'View dashboard statistics and reports',
  manage_system: 'Access system settings and configuration',
  manage_appraisals: 'Add and edit appraisal records for artworks',
} as const;