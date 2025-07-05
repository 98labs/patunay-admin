export type UserRole = 'super_user' | 'admin' | 'issuer' | 'appraiser' | 'staff' | 'viewer';
export type OrganizationType = 'gallery' | 'museum' | 'artist' | 'collector' | 'auction_house' | 'other';
export type CrossOrgPermissionType = 'issuer_access' | 'appraiser_access' | 'viewer_access' | 'consultant_access';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  organization_id?: string;
  organization?: Organization;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  email_confirmed_at?: string;
  permissions?: string[];
  organizations?: OrganizationUser[];
  cross_org_permissions?: CrossOrgPermission[];
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  permissions: string[];
  is_primary: boolean;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  organization?: Organization;
}

export interface CrossOrgPermission {
  id: string;
  user_id: string;
  organization_id: string;
  permission_type: CrossOrgPermissionType;
  permissions: string[];
  expires_at?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  approved_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  organization?: Organization;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  organization_id?: string;
  phone?: string;
  permissions?: string[];
}

export interface CreateOrganizationData {
  name: string;
  type: OrganizationType;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  settings?: Record<string, any>;
}

export interface UpdateUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  organization_id?: string;
  is_active?: boolean;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateOrganizationData {
  id: string;
  name?: string;
  type?: OrganizationType;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  settings?: Record<string, any>;
  is_active?: boolean;
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
  organization_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface OrganizationFilters {
  type?: OrganizationType;
  is_active?: boolean;
  search?: string;
}

export const USER_ROLES: Record<UserRole, { label: string; description: string }> = {
  super_user: {
    label: 'Super User',
    description: 'Global system access - manage everything across all organizations',
  },
  admin: {
    label: 'Administrator',
    description: 'Organization admin - manage users, artworks, and settings within own organization',
  },
  issuer: {
    label: 'Issuer',
    description: 'NFC tag issuer - manage NFC tags and attach to artworks (can work across organizations)',
  },
  appraiser: {
    label: 'Appraiser',
    description: 'Artwork appraiser - add and manage appraisal information (can work across organizations)',
  },
  staff: {
    label: 'Staff',
    description: 'Organization staff - manage artwork records but cannot issue NFC tags',
  },
  viewer: {
    label: 'Viewer',
    description: 'Basic access - view artwork information (excluding appraisal details)',
  },
};

export const ORGANIZATION_TYPES: Record<OrganizationType, { label: string; description: string }> = {
  gallery: {
    label: 'Gallery',
    description: 'Art gallery or exhibition space',
  },
  museum: {
    label: 'Museum',
    description: 'Museum or cultural institution',
  },
  artist: {
    label: 'Artist',
    description: 'Individual artist or artist studio',
  },
  collector: {
    label: 'Collector',
    description: 'Private collector or collection',
  },
  auction_house: {
    label: 'Auction House',
    description: 'Auction house or sales organization',
  },
  other: {
    label: 'Other',
    description: 'Other type of organization',
  },
};

export const CROSS_ORG_PERMISSION_TYPES: Record<CrossOrgPermissionType, { label: string; description: string }> = {
  issuer_access: {
    label: 'Issuer Access',
    description: 'Can issue NFC tags for this organization\'s artworks',
  },
  appraiser_access: {
    label: 'Appraiser Access',
    description: 'Can appraise this organization\'s artworks',
  },
  viewer_access: {
    label: 'Viewer Access',
    description: 'Can view this organization\'s artworks',
  },
  consultant_access: {
    label: 'Consultant Access',
    description: 'General consulting access to this organization',
  },
};

export const DEFAULT_PERMISSIONS = {
  super_user: [
    'manage_organizations',
    'manage_all_users',
    'manage_all_artworks',
    'manage_all_nfc_tags',
    'view_all_statistics',
    'manage_system',
    'manage_all_appraisals',
  ],
  admin: [
    'manage_org_users',
    'manage_org_artworks',
    'manage_org_nfc_tags',
    'view_org_statistics',
    'manage_org_settings',
    'manage_org_appraisals',
    'grant_cross_org_permissions',
  ],
  issuer: [
    'attach_nfc_tags',
    'view_own_artworks',
    'create_artworks',
  ],
  appraiser: [
    'create_appraisals',
    'update_appraisals',
    'view_artwork_details',
  ],
  staff: [
    'manage_artworks',
    'view_artworks',
    'manage_appraisals',
    'view_statistics',
  ],
  viewer: [
    'view_artworks',
    'view_public_statistics',
  ],
} as const;

export const PERMISSION_DESCRIPTIONS = {
  // Super User permissions
  manage_organizations: 'Create, update, and delete organizations',
  manage_all_users: 'Manage users across all organizations',
  manage_all_artworks: 'Manage artworks across all organizations',
  manage_all_nfc_tags: 'Manage NFC tags across all organizations',
  view_all_statistics: 'View statistics across all organizations',
  manage_system: 'Access system-wide settings and configuration',
  manage_all_appraisals: 'Manage appraisals across all organizations',
  
  // Admin permissions (organization-scoped)
  manage_org_users: 'Manage users within own organization',
  manage_org_artworks: 'Manage artworks within own organization',
  manage_org_nfc_tags: 'Manage NFC tags within own organization',
  view_org_statistics: 'View statistics for own organization',
  manage_org_settings: 'Manage organization settings',
  manage_org_appraisals: 'Manage appraisals within own organization',
  grant_cross_org_permissions: 'Grant cross-organizational permissions',
  
  // Issuer permissions
  manage_nfc_tags: 'Create and manage NFC tags',
  attach_nfc_tags: 'Attach NFC tags to artworks',
  view_own_artworks: 'View artworks they have access to',
  create_artworks: 'Create new artwork records',
  
  // Appraiser permissions
  create_appraisals: 'Create appraisal records',
  update_appraisals: 'Update existing appraisal records',
  view_artwork_details: 'View detailed artwork information',
  
  // Staff permissions
  manage_artworks: 'Create and update artwork records',
  view_artworks: 'View artwork information',
  manage_appraisals: 'Create and update appraisal records',
  view_statistics: 'View basic statistics',
  
  // Viewer permissions
  view_public_statistics: 'View public statistics',
  
  // Legacy permissions (for backward compatibility)
  manage_users: 'Create, update, and delete user accounts',
} as const;

// Permission categories for better organization
export const PERMISSION_CATEGORIES = {
  organizations: 'Organizations',
  users: 'User Management',
  artworks: 'Artwork Management',
  nfc_tags: 'NFC Tags',
  appraisals: 'Appraisals',
  system: 'System & Statistics',
} as const;

export type PermissionCategory = keyof typeof PERMISSION_CATEGORIES;