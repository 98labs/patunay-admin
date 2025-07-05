-- Create locations table (branches of organizations)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Optional location code/identifier
    description TEXT,
    
    -- Address information
    address JSONB DEFAULT '{}'::jsonb, -- Structured address data
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Manager/head of location
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Settings and metadata
    settings JSONB DEFAULT '{}'::jsonb,
    is_headquarters BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_location_code_per_org UNIQUE(organization_id, code),
    CONSTRAINT unique_location_name_per_org UNIQUE(organization_id, name)
);

-- Create location_users table (assigns users to locations)
CREATE TABLE IF NOT EXISTS location_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Role at this specific location (can be different from org role)
    role user_role NOT NULL DEFAULT 'viewer',
    
    -- Location-specific permissions (overrides/extends org permissions)
    permissions TEXT[] DEFAULT '{}',
    
    -- Assignment details
    is_primary_location BOOLEAN DEFAULT false, -- User's main location
    can_access_other_locations BOOLEAN DEFAULT false, -- Can access other locations in the org
    
    -- Employment/assignment info
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
    created_by UUID REFERENCES profiles(id),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_user_location UNIQUE(location_id, user_id),
    CONSTRAINT one_primary_location_per_user_org UNIQUE(user_id, organization_id, is_primary_location) WHERE is_primary_location = true
);

-- Create indexes for performance
CREATE INDEX idx_locations_organization_id ON locations(organization_id);
CREATE INDEX idx_locations_is_active ON locations(is_active);
CREATE INDEX idx_locations_manager_id ON locations(manager_id);
CREATE INDEX idx_location_users_location_id ON location_users(location_id);
CREATE INDEX idx_location_users_user_id ON location_users(user_id);
CREATE INDEX idx_location_users_organization_id ON location_users(organization_id);
CREATE INDEX idx_location_users_is_active ON location_users(is_active);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations table

-- Super users can do everything
CREATE POLICY "Super users have full access to locations" ON locations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_user'
        )
    );

-- Organization admins can manage their org's locations
CREATE POLICY "Org admins can manage their locations" ON locations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = locations.organization_id
            AND ou.role = 'admin'
            AND ou.is_active = true
        )
    );

-- Users can view locations they're assigned to
CREATE POLICY "Users can view their assigned locations" ON locations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM location_users lu
            WHERE lu.user_id = auth.uid()
            AND lu.location_id = locations.id
            AND lu.is_active = true
        )
        OR
        -- Users with org-wide permissions can view all org locations
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = locations.organization_id
            AND ou.is_active = true
            AND (
                ou.permissions && ARRAY['view_all_locations', 'manage_locations']
                OR ou.role IN ('admin', 'super_user')
            )
        )
    );

-- Location managers can update their location
CREATE POLICY "Location managers can update their location" ON locations
    FOR UPDATE TO authenticated
    USING (
        locations.manager_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = locations.organization_id
            AND ou.role = 'admin'
            AND ou.is_active = true
        )
    );

-- RLS Policies for location_users table

-- Super users can do everything
CREATE POLICY "Super users have full access to location_users" ON location_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_user'
        )
    );

-- Organization admins can manage location assignments
CREATE POLICY "Org admins can manage location assignments" ON location_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = location_users.organization_id
            AND ou.role = 'admin'
            AND ou.is_active = true
        )
    );

-- Location managers can manage their location's users
CREATE POLICY "Location managers can manage their location users" ON location_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM locations l
            WHERE l.id = location_users.location_id
            AND l.manager_id = auth.uid()
        )
    );

-- Users can view their own location assignments
CREATE POLICY "Users can view their own location assignments" ON location_users
    FOR SELECT TO authenticated
    USING (
        location_users.user_id = auth.uid()
        OR
        -- Users in the same location can see each other
        EXISTS (
            SELECT 1 FROM location_users my_lu
            WHERE my_lu.user_id = auth.uid()
            AND my_lu.location_id = location_users.location_id
            AND my_lu.is_active = true
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_users_updated_at BEFORE UPDATE ON location_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get user's locations
CREATE OR REPLACE FUNCTION get_user_locations(p_user_id UUID)
RETURNS TABLE (
    location_id UUID,
    location_name VARCHAR(255),
    organization_id UUID,
    organization_name VARCHAR(255),
    role user_role,
    is_primary_location BOOLEAN,
    can_access_other_locations BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id AS location_id,
        l.name AS location_name,
        o.id AS organization_id,
        o.name AS organization_name,
        lu.role,
        lu.is_primary_location,
        lu.can_access_other_locations
    FROM location_users lu
    JOIN locations l ON l.id = lu.location_id
    JOIN organizations o ON o.id = l.organization_id
    WHERE lu.user_id = p_user_id
    AND lu.is_active = true
    AND l.is_active = true
    AND o.is_active = true
    ORDER BY lu.is_primary_location DESC, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to a location
CREATE OR REPLACE FUNCTION user_has_location_access(p_user_id UUID, p_location_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM location_users lu
        WHERE lu.user_id = p_user_id
        AND lu.location_id = p_location_id
        AND lu.is_active = true
    ) OR EXISTS (
        -- Check if user has org-wide access
        SELECT 1
        FROM locations l
        JOIN organization_users ou ON ou.organization_id = l.organization_id
        WHERE l.id = p_location_id
        AND ou.user_id = p_user_id
        AND ou.is_active = true
        AND (
            ou.role IN ('admin', 'super_user')
            OR ou.permissions && ARRAY['access_all_locations']
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add location_id to artworks table for location-based artwork management
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_artworks_location_id ON artworks(location_id);

-- Update artwork RLS to consider location access
CREATE OR REPLACE FUNCTION user_can_access_artwork(p_user_id UUID, p_artwork_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_artwork_location_id UUID;
    v_artwork_org_id UUID;
BEGIN
    -- Get artwork's location and organization
    SELECT location_id, organization_id INTO v_artwork_location_id, v_artwork_org_id
    FROM artworks
    WHERE id = p_artwork_id;
    
    -- If artwork has a location, check location access
    IF v_artwork_location_id IS NOT NULL THEN
        RETURN user_has_location_access(p_user_id, v_artwork_location_id);
    END IF;
    
    -- Otherwise, check organization access
    RETURN EXISTS (
        SELECT 1
        FROM organization_users ou
        WHERE ou.user_id = p_user_id
        AND ou.organization_id = v_artwork_org_id
        AND ou.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data for testing (commented out for production)
-- INSERT INTO locations (organization_id, name, code, city, country, is_headquarters) VALUES
-- ('your-org-id', 'Main Office', 'HQ', 'New York', 'USA', true),
-- ('your-org-id', 'London Branch', 'LON', 'London', 'UK', false),
-- ('your-org-id', 'Tokyo Branch', 'TYO', 'Tokyo', 'Japan', false);