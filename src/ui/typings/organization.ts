// Organization-specific types and interfaces
import { UserRole, OrganizationType, CrossOrgPermissionType } from './user';

export interface OrganizationStats {
  total_users: number;
  active_users: number;
  total_artworks: number;
  total_nfc_tags: number;
  active_nfc_tags: number;
  total_appraisals: number;
  recent_activity: number;
}

export interface OrganizationMembership {
  organization_id: string;
  user_id: string;
  role: UserRole;
  permissions: string[];
  is_primary: boolean;
  is_active: boolean;
  joined_at: string;
  organization_name?: string;
  organization_type?: OrganizationType;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  permissions: string[];
  invited_by: string;
  expires_at: string;
  accepted_at?: string;
  rejected_at?: string;
  created_at: string;
  organization?: {
    name: string;
    type: OrganizationType;
  };
}

export interface OrganizationPermissionRequest {
  id: string;
  requester_id: string;
  organization_id: string;
  requested_role: UserRole;
  requested_permissions: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationAuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Access control helper types
export interface AccessControlContext {
  user_id: string;
  user_role: UserRole;
  organization_id?: string;
  resource_organization_id?: string;
  requested_permission: string;
  resource_type?: string;
  resource_id?: string;
}

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  required_permission?: string;
  alternative_access?: string[];
}

// Organization settings schema
export interface OrganizationSettings {
  features: {
    nfc_tags_enabled: boolean;
    appraisals_enabled: boolean;
    cross_org_sharing: boolean;
    public_artworks: boolean;
  };
  security: {
    require_approval_for_cross_org: boolean;
    session_timeout_minutes: number;
    require_2fa: boolean;
  };
  notifications: {
    email_notifications: boolean;
    artwork_updates: boolean;
    user_management: boolean;
    system_alerts: boolean;
  };
  branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    custom_css?: string;
  };
}

// Default organization settings
export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  features: {
    nfc_tags_enabled: true,
    appraisals_enabled: true,
    cross_org_sharing: false,
    public_artworks: false,
  },
  security: {
    require_approval_for_cross_org: true,
    session_timeout_minutes: 480, // 8 hours
    require_2fa: false,
  },
  notifications: {
    email_notifications: true,
    artwork_updates: true,
    user_management: true,
    system_alerts: true,
  },
  branding: {},
};

// Permission validation helpers
export const ORGANIZATION_ADMIN_PERMISSIONS = [
  'manage_org_users',
  'manage_org_artworks',
  'manage_org_nfc_tags',
  'view_org_statistics',
  'manage_org_settings',
  'manage_org_appraisals',
  'grant_cross_org_permissions',
] as const;

export const CROSS_ORG_CAPABILITIES = {
  issuer: ['manage_nfc_tags', 'attach_nfc_tags', 'create_artworks'],
  appraiser: ['create_appraisals', 'update_appraisals', 'view_artwork_details'],
  viewer: ['view_artworks'],
  consultant: ['view_artworks', 'view_artwork_details'],
} as const;

// Organization role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_user: 100,
  admin: 80,
  issuer: 60,
  appraiser: 60,
  staff: 40,
  viewer: 20,
};

export function canUserManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

export function getMaxAssignableRole(userRole: UserRole): UserRole[] {
  const userLevel = ROLE_HIERARCHY[userRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level < userLevel)
    .map(([role]) => role as UserRole);
}