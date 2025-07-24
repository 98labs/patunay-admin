-- Combined migration for organizations and locations
-- This ensures all dependencies are created in the correct order

-- Skip if organizations already exists (migration was already applied)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        RAISE NOTICE 'Organizations table already exists, skipping organizations creation';
    ELSE
        -- Create organizations table from 20250626_multi_tenant_rbac_final.sql
        RAISE NOTICE 'Creating organizations and multi-tenant RBAC tables...';
        
        -- Note: You would need to copy the full content from 20250626_multi_tenant_rbac_final.sql here
        -- For now, this is a placeholder
        RAISE EXCEPTION 'Please copy the full content from 20250626_multi_tenant_rbac_final.sql';
    END IF;
END $$;

-- Now create locations tables (these depend on organizations)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    
    -- Address information
    address JSONB DEFAULT '{}'::jsonb,
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

-- Continue with the rest of the locations migration...