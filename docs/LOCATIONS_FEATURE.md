# Locations (Branch Management) Feature

## Overview

The Locations feature enables organizations to manage multiple physical locations or branches, assign users to specific locations, and control access to resources based on location assignments. This feature is particularly useful for galleries, museums, or collectors with multiple sites.

## Database Schema

### Tables

#### locations
Stores information about organization branches/locations.

```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Optional location identifier
    description TEXT,
    
    -- Address fields
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact info
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Management
    manager_id UUID REFERENCES profiles(id),
    settings JSONB DEFAULT '{}',
    is_headquarters BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

#### location_users
Manages user assignments to locations with location-specific roles and permissions.

```sql
CREATE TABLE location_users (
    id UUID PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Location-specific role (can override org role)
    role user_role NOT NULL DEFAULT 'viewer',
    permissions TEXT[] DEFAULT '{}',
    
    -- Assignment details
    is_primary_location BOOLEAN DEFAULT false,
    can_access_other_locations BOOLEAN DEFAULT false,
    department VARCHAR(100),
    position VARCHAR(100),
    employee_id VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

## Key Features

### 1. Location Management
- Create and manage multiple locations per organization
- Set location details including address, contact info, and manager
- Designate headquarters location
- Location-specific settings and configuration

### 2. User Assignment
- Assign users to one or more locations
- Set primary location for each user
- Location-specific roles that can override organization roles
- Control cross-location access permissions

### 3. Access Control
- Location-based Row Level Security (RLS)
- Users can only access data from their assigned locations
- Location managers have additional permissions for their location
- Admin and super users can access all locations

### 4. Integration with Existing Features
- Artworks can be assigned to specific locations
- Location-based filtering for all resources
- Location context in user sessions

## API Endpoints

### Location Management

```typescript
// Get all locations
GET /api/locations?organization_id=xxx

// Get single location
GET /api/locations/:id

// Create location
POST /api/locations
{
  "organization_id": "xxx",
  "name": "Downtown Gallery",
  "code": "DTG",
  "city": "New York",
  "country": "USA",
  "manager_id": "xxx"
}

// Update location
PUT /api/locations/:id

// Delete location (soft delete)
DELETE /api/locations/:id
```

### Location User Management

```typescript
// Get location users
GET /api/locations/:id/users

// Assign user to location
POST /api/location-users
{
  "location_id": "xxx",
  "user_id": "xxx",
  "role": "staff",
  "is_primary_location": true
}

// Update location assignment
PUT /api/location-users/:id

// Remove user from location
DELETE /api/location-users/:id
```

## Permissions

### New Permissions Added

- `manage_all_locations` - Super user permission to manage all locations
- `manage_locations` - Admin permission to manage organization locations
- `view_all_locations` - Permission to view all organization locations
- `access_all_locations` - Permission to access data from all locations

### Permission Hierarchy

1. **Super User**: Full access to all locations across all organizations
2. **Admin**: Can manage all locations within their organization
3. **Location Manager**: Can update their location and manage location users
4. **Staff/Other Roles**: Access based on location assignment

## Usage Examples

### React Components

```typescript
// Using location hooks
import { useGetLocationsQuery, useAssignUserToLocationMutation } from '@/store/api/locationApi';

function LocationManager() {
  const { data: locations, isLoading } = useGetLocationsQuery({
    filters: { organization_id: currentOrg.id }
  });
  
  const [assignUser] = useAssignUserToLocationMutation();
  
  const handleAssignUser = async (userId: string, locationId: string) => {
    await assignUser({
      user_id: userId,
      location_id: locationId,
      role: 'staff',
      is_primary_location: true
    });
  };
  
  // Render locations...
}
```

### Permission Checks

```typescript
// Check location permissions
const { canManageLocations, canViewAllLocations } = usePermissions();

if (canManageLocations) {
  // Show location management UI
}

// Check if user has access to specific location
const hasAccess = await checkLocationAccess(userId, locationId);
```

## Security Considerations

### Row Level Security
- All location data is protected by RLS policies
- Users can only see locations they're assigned to
- Organization boundaries are strictly enforced

### Data Isolation
- Location data is isolated by organization
- Cross-location access requires explicit permission
- Soft deletes maintain data integrity

## Migration Notes

### Adding Locations to Existing System

1. Run the migration: `20250105_locations_and_location_users.sql`
2. Create initial locations for existing organizations
3. Assign existing users to appropriate locations
4. Update artworks with location assignments if needed

### Sample Migration Script

```sql
-- Create headquarters for existing organizations
INSERT INTO locations (organization_id, name, code, is_headquarters)
SELECT id, name || ' Headquarters', 'HQ', true
FROM organizations
WHERE is_active = true;

-- Assign all existing org users to headquarters
INSERT INTO location_users (location_id, user_id, organization_id, role, is_primary_location)
SELECT 
  l.id,
  ou.user_id,
  ou.organization_id,
  ou.role,
  true
FROM organization_users ou
JOIN locations l ON l.organization_id = ou.organization_id AND l.is_headquarters = true
WHERE ou.is_active = true;
```

## Best Practices

### Location Setup
1. Always designate one headquarters location
2. Use meaningful location codes for easy identification
3. Assign location managers for better oversight
4. Set up location-specific settings as needed

### User Assignment
1. Every user should have a primary location
2. Grant cross-location access sparingly
3. Use location-specific roles when needed
4. Track employment details for compliance

### Performance
1. Use location filtering in all queries
2. Index location_id columns on related tables
3. Cache user location assignments
4. Batch location operations when possible

## Future Enhancements

### Planned Features
1. Location-based reporting and analytics
2. Inter-location artwork transfers
3. Location-specific branding/themes
4. Geofencing and location verification
5. Location capacity management

### Integration Opportunities
1. Location-based inventory management
2. Staff scheduling by location
3. Location-specific pricing/currency
4. Multi-location exhibitions
5. Location performance dashboards