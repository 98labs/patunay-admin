import supabase from '../../supabase';
import { 
  Location, 
  LocationUser, 
  CreateLocationData, 
  UpdateLocationData, 
  AssignUserToLocationData 
} from '../../typings';

// Helper function to construct full name
export const getFullName = (firstName: string, lastName: string) => {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
};

export interface LocationWithManager extends Location {
  manager: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  } | null;
}

export interface LocationUserWithDetails extends LocationUser {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    full_name?: string;
  };
  location: {
    id: string;
    name: string;
  };
}

// Location CRUD operations
export async function getLocations(organizationId: string) {
  // Use the view that handles access control
  const { data, error } = await supabase
    .from('my_accessible_locations')
    .select(`
      *,
      manager:profiles!locations_manager_id_fkey(
        id,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name');

  if (error) {
    // Fallback to direct query if view doesn't exist yet
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('locations')
      .select(`
        *,
        manager:profiles!locations_manager_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('name');
    
    if (fallbackError) throw fallbackError;
    return fallbackData as LocationWithManager[];
  }
  
  return data as LocationWithManager[];
}

export async function getLocation(id: string) {
  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      manager:profiles!locations_manager_id_fkey(
        id,
        first_name,
        last_name
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as LocationWithManager;
}

export async function createLocation(location: CreateLocationData) {
  // Clean up empty strings that should be null
  const cleanLocation = {
    ...location,
    manager_id: location.manager_id || null,
    code: location.code || null,
    description: location.description || null,
    street: location.street || null,
    city: location.city || null,
    state: location.state || null,
    postal_code: location.postal_code || null,
    phone: location.phone || null,
    email: location.email || null
  };

  const { data, error } = await supabase
    .from('locations')
    .insert(cleanLocation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLocation(id: string, location: Partial<UpdateLocationData>) {
  // Clean up empty strings that should be null
  const cleanLocation: any = {
    ...location,
    updated_at: new Date().toISOString()
  };

  // Convert empty strings to null for optional fields
  if ('manager_id' in cleanLocation && cleanLocation.manager_id === '') {
    cleanLocation.manager_id = null;
  }
  if ('code' in cleanLocation && cleanLocation.code === '') {
    cleanLocation.code = null;
  }
  if ('description' in cleanLocation && cleanLocation.description === '') {
    cleanLocation.description = null;
  }

  const { data, error } = await supabase
    .from('locations')
    .update(cleanLocation)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLocation(id: string) {
  const { error } = await supabase
    .from('locations')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

// Location Users operations
export async function getLocationUsers(locationId: string) {
  // Try to use RPC function first for email support
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_location_users_with_email', {
      p_location_id: locationId
    });

  if (!rpcError && rpcData) {
    // Transform RPC data to match our interface
    return rpcData.map(row => ({
      id: row.id,
      location_id: row.location_id,
      user_id: row.user_id,
      organization_id: row.organization_id,
      role: row.role,
      permissions: row.permissions,
      is_primary_location: row.is_primary_location,
      can_access_other_locations: row.can_access_other_locations,
      department: row.department,
      position: row.position,
      employee_id: row.employee_id,
      start_date: row.start_date,
      end_date: row.end_date,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      deleted_at: row.deleted_at,
      user: {
        id: row.user_id,
        first_name: row.user_first_name || '',
        last_name: row.user_last_name || '',
        email: row.user_email || '',
        avatar_url: row.user_avatar_url,
        full_name: undefined
      },
      location: {
        id: row.location_id,
        name: row.location_name
      }
    })) as LocationUserWithDetails[];
  }

  // Fallback to regular query without email
  const { data, error } = await supabase
    .from('location_users')
    .select(`
      *,
      user:profiles!location_users_user_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      ),
      location:locations(
        id,
        name
      )
    `)
    .eq('location_id', locationId)
    .is('deleted_at', null);

  if (error) throw error;
  
  // Add placeholder email for fallback
  return (data || []).map(item => ({
    ...item,
    user: {
      ...item.user,
      email: 'user@example.com'
    }
  })) as LocationUserWithDetails[];
}

export async function getUserLocations(userId: string) {
  const { data, error } = await supabase
    .from('location_users')
    .select(`
      *,
      location:locations(
        id,
        name,
        code,
        city,
        country,
        is_headquarters
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_primary_location', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addUserToLocation(locationUser: AssignUserToLocationData) {
  const { data, error } = await supabase
    .from('location_users')
    .insert(locationUser)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLocationUser(id: string, updates: Partial<LocationUser>) {
  const { data, error } = await supabase
    .from('location_users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeUserFromLocation(id: string) {
  const { error } = await supabase
    .from('location_users')
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

// Check if user has access to a location
export async function checkLocationAccess(userId: string, locationId: string) {
  const { data, error } = await supabase
    .rpc('user_has_location_access', {
      p_user_id: userId,
      p_location_id: locationId
    });

  if (error) throw error;
  return data as boolean;
}

// Get user's primary location
export async function getUserPrimaryLocation(userId: string, organizationId: string) {
  const { data, error } = await supabase
    .from('location_users')
    .select(`
      *,
      location:locations(*)
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_primary_location', true)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
  return data;
}