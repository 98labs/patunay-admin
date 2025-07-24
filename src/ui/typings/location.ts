import { UserRole } from './user';

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  description?: string;
  
  // Address information
  address?: Record<string, any>;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  
  // Contact information
  phone?: string;
  email?: string;
  
  // Manager
  manager_id?: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  
  // Settings and metadata
  settings?: Record<string, any>;
  is_headquarters?: boolean;
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Relations
  organization?: {
    id: string;
    name: string;
    type: string;
  };
  user_count?: number;
  artwork_count?: number;
}

export interface LocationUser {
  id: string;
  location_id: string;
  user_id: string;
  organization_id: string;
  
  // Role and permissions
  role: UserRole;
  permissions: string[];
  
  // Assignment details
  is_primary_location: boolean;
  can_access_other_locations: boolean;
  
  // Employment info
  department?: string;
  position?: string;
  employee_id?: string;
  
  // Status
  is_active: boolean;
  start_date: string;
  end_date?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted_at?: string;
  
  // Relations
  location?: Location;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    avatar_url?: string;
    phone?: string;
  };
}

export interface CreateLocationData {
  organization_id: string;
  name: string;
  code?: string;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_headquarters?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateLocationData extends Partial<CreateLocationData> {
  id: string;
  is_active?: boolean;
}

export interface AssignUserToLocationData {
  location_id: string;
  user_id: string;
  organization_id: string;
  role?: UserRole;
  permissions?: string[];
  is_primary_location?: boolean;
  can_access_other_locations?: boolean;
  department?: string;
  position?: string;
  employee_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface LocationFilters {
  organization_id?: string;
  is_active?: boolean;
  is_headquarters?: boolean;
  manager_id?: string;
  city?: string;
  state?: string;
  country?: string;
  search?: string;
}

export interface LocationStats {
  total_users: number;
  active_users: number;
  total_artworks: number;
  total_appraisals: number;
  recent_activity: number;
}