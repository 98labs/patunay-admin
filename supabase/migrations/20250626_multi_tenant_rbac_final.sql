-- Multi-Tenant RBAC + ABAC Schema Migration (Final Version)
-- This migration adds organizational structure and enhanced role-based access control
-- Fixed to work with all PostgreSQL versions

-- ============================================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ============================================================================

-- Organization types enum
DO $$ BEGIN
    CREATE TYPE organization_type AS ENUM ('gallery', 'museum', 'artist', 'collector', 'auction_house', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type organization_type NOT NULL DEFAULT 'other',
  description text,
  website text,
  contact_email text,
  contact_phone text,
  address jsonb, -- {street, city, state, country, postal_code}
  settings jsonb DEFAULT '{}'::jsonb, -- organization-specific settings
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id),
  CONSTRAINT organizations_name_check CHECK (length(name) >= 2),
  CONSTRAINT organizations_email_check CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL)
);

-- Create indexes for organizations (only if they don't exist)
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations(type);
    CREATE INDEX IF NOT EXISTS idx_organizations_active ON public.organizations(is_active);
    CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
END $$;

-- ============================================================================
-- 2. CREATE NEW USER ROLE ENUM AND ADD COLUMNS SAFELY
-- ============================================================================

-- New user role enum
DO $$ BEGIN
    CREATE TYPE user_role_new AS ENUM ('super_user', 'admin', 'issuer', 'appraiser', 'staff', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to profiles table (only if they don't exist)
DO $$ BEGIN
    -- Add organization_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
    END IF;
    
    -- Add new role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_new') THEN
        ALTER TABLE public.profiles ADD COLUMN role_new user_role_new DEFAULT 'viewer';
    END IF;
END $$;

-- Update existing roles to new enum (only if role_new column exists and has default values)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_new') THEN
        UPDATE public.profiles SET role_new = 
          CASE 
            WHEN role::text = 'admin' THEN 'admin'::user_role_new
            WHEN role::text = 'staff' THEN 'staff'::user_role_new
            ELSE 'viewer'::user_role_new
          END
        WHERE role_new = 'viewer'; -- Only update if it's still the default value
        
        -- Set role_new as NOT NULL
        ALTER TABLE public.profiles ALTER COLUMN role_new SET NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- 3. HANDLE DEPENDENCIES - SIMPLIFIED APPROACH
-- ============================================================================

-- Drop known dependent views
DROP VIEW IF EXISTS public.current_user_profile CASCADE;
DROP VIEW IF EXISTS public.profiles_view CASCADE;

-- Drop known policies that might reference the role column
DO $$ 
DECLARE
    policy_name text;
    table_name text;
BEGIN
    -- List of known policies that might reference role column
    FOR policy_name, table_name IN VALUES 
        ('Admins can manage all permissions', 'user_permissions'),
        ('Admins can manage all sessions', 'user_sessions'),
        ('Admins can manage user permissions', 'user_permissions')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
            RAISE NOTICE 'Dropped policy: % on %', policy_name, table_name;
        EXCEPTION 
            WHEN OTHERS THEN 
                RAISE NOTICE 'Could not drop policy % on % (this is ok): %', policy_name, table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- 4. SAFELY REPLACE ROLE COLUMN
-- ============================================================================

-- Now we can safely drop the old role column and rename the new one
DO $$ BEGIN
    -- Only proceed if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_new') THEN
        
        -- Drop the old role column
        ALTER TABLE public.profiles DROP COLUMN role CASCADE;
        
        -- Rename the new column
        ALTER TABLE public.profiles RENAME COLUMN role_new TO role;
        
        RAISE NOTICE 'Successfully replaced role column';
    END IF;
END $$;

-- ============================================================================
-- 5. RECREATE ESSENTIAL VIEWS AND POLICIES
-- ============================================================================

-- Recreate current_user_profile view with new role enum
CREATE OR REPLACE VIEW public.current_user_profile AS
SELECT 
  p.*,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

-- Recreate profiles_view if it was used
CREATE OR REPLACE VIEW public.profiles_view AS
SELECT 
  p.*,
  u.email,
  u.created_at as user_created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;

-- Recreate essential RLS policies with new role enum
DO $$ BEGIN
    CREATE POLICY "Super users and admins can manage all permissions" ON public.user_permissions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() 
            AND role IN ('super_user', 'admin')
            AND is_active = true
        )
      );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy already exists: Super users and admins can manage all permissions';
END $$;

DO $$ BEGIN
    CREATE POLICY "Super users and admins can manage all sessions" ON public.user_sessions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() 
            AND role IN ('super_user', 'admin')
            AND is_active = true
        )
      );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy already exists: Super users and admins can manage all sessions';
END $$;

-- ============================================================================
-- 6. ORGANIZATION USERS (Many-to-Many Relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_new NOT NULL,
  permissions text[] DEFAULT '{}', -- array of specific permissions
  is_primary boolean DEFAULT false, -- primary organization for user
  is_active boolean DEFAULT true,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id)
);

-- Add constraints only if they don't exist
DO $$ BEGIN
    -- Unique constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_users_unique_user_org') THEN
        ALTER TABLE public.organization_users 
        ADD CONSTRAINT organization_users_unique_user_org UNIQUE(organization_id, user_id);
    END IF;
    
    -- Check constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_users_role_permissions_check') THEN
        ALTER TABLE public.organization_users 
        ADD CONSTRAINT organization_users_role_permissions_check CHECK (
          role = 'super_user' OR 
          (permissions IS NOT NULL AND array_length(permissions, 1) >= 0)
        );
    END IF;
END $$;

-- Indexes for organization_users (only if they don't exist)
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON public.organization_users(organization_id);
    CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
    CREATE INDEX IF NOT EXISTS idx_organization_users_role ON public.organization_users(role);
    CREATE INDEX IF NOT EXISTS idx_organization_users_active ON public.organization_users(is_active);
    CREATE INDEX IF NOT EXISTS idx_organization_users_primary ON public.organization_users(is_primary) WHERE is_primary = true;
END $$;

-- ============================================================================
-- 7. ADD ORGANIZATION CONTEXT TO EXISTING TABLES
-- ============================================================================

-- Add organization_id to artworks (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'organization_id') THEN
        ALTER TABLE public.artworks ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        CREATE INDEX IF NOT EXISTS idx_artworks_organization_id ON public.artworks(organization_id);
    END IF;
END $$;

-- Add organization_id to tags (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tags' AND column_name = 'organization_id') THEN
        ALTER TABLE public.tags ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON public.tags(organization_id);
    END IF;
END $$;

-- Add organization_id to artwork_appraisers (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artwork_appraisers' AND column_name = 'organization_id') THEN
        ALTER TABLE public.artwork_appraisers ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        CREATE INDEX IF NOT EXISTS idx_artwork_appraisers_organization_id ON public.artwork_appraisers(organization_id);
    END IF;
END $$;

-- ============================================================================
-- 8. CROSS-ORGANIZATIONAL PERMISSIONS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE cross_org_permission_type AS ENUM (
      'issuer_access',      -- Can issue NFC tags for this org's artworks
      'appraiser_access',   -- Can appraise this org's artworks
      'viewer_access',      -- Can view this org's artworks
      'consultant_access'   -- General consulting access
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.cross_org_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  permission_type cross_org_permission_type NOT NULL,
  permissions text[] DEFAULT '{}', -- specific permissions granted
  expires_at timestamp with time zone, -- optional expiration
  is_active boolean DEFAULT true,
  notes text, -- why this permission was granted
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id), -- who approved this cross-org access
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id)
);

-- Add constraints only if they don't exist
DO $$ BEGIN
    -- Unique constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cross_org_permissions_unique') THEN
        ALTER TABLE public.cross_org_permissions 
        ADD CONSTRAINT cross_org_permissions_unique UNIQUE(user_id, organization_id, permission_type);
    END IF;
    
    -- Check constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cross_org_permissions_expiry_check') THEN
        ALTER TABLE public.cross_org_permissions 
        ADD CONSTRAINT cross_org_permissions_expiry_check CHECK (expires_at IS NULL OR expires_at > created_at);
    END IF;
END $$;

-- Indexes for cross_org_permissions (only if they don't exist)
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_cross_org_permissions_user_id ON public.cross_org_permissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_cross_org_permissions_org_id ON public.cross_org_permissions(organization_id);
    CREATE INDEX IF NOT EXISTS idx_cross_org_permissions_type ON public.cross_org_permissions(permission_type);
    CREATE INDEX IF NOT EXISTS idx_cross_org_permissions_active ON public.cross_org_permissions(is_active);
    CREATE INDEX IF NOT EXISTS idx_cross_org_permissions_expires ON public.cross_org_permissions(expires_at) WHERE expires_at IS NOT NULL;
END $$;

-- ============================================================================
-- 9. ROLE-BASED PERMISSIONS DEFINITION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_new NOT NULL,
  permission text NOT NULL,
  description text,
  category text, -- 'users', 'artworks', 'nfc_tags', 'system', 'appraisals', 'organizations'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Add unique constraint only if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_unique') THEN
        ALTER TABLE public.role_permissions 
        ADD CONSTRAINT role_permissions_unique UNIQUE(role, permission);
    END IF;
END $$;

-- Insert default role permissions (only if table is empty)
DO $$ BEGIN
    IF (SELECT COUNT(*) FROM public.role_permissions) = 0 THEN
        INSERT INTO public.role_permissions (role, permission, description, category) VALUES
        -- Super User permissions
        ('super_user', 'manage_organizations', 'Create, update, and delete organizations', 'organizations'),
        ('super_user', 'manage_all_users', 'Manage users across all organizations', 'users'),
        ('super_user', 'manage_all_artworks', 'Manage artworks across all organizations', 'artworks'),
        ('super_user', 'manage_all_nfc_tags', 'Manage NFC tags across all organizations', 'nfc_tags'),
        ('super_user', 'view_all_statistics', 'View statistics across all organizations', 'system'),
        ('super_user', 'manage_system', 'Access system-wide settings and configuration', 'system'),
        ('super_user', 'manage_all_appraisals', 'Manage appraisals across all organizations', 'appraisals'),

        -- Admin permissions (organization-scoped)
        ('admin', 'manage_org_users', 'Manage users within own organization', 'users'),
        ('admin', 'manage_org_artworks', 'Manage artworks within own organization', 'artworks'),
        ('admin', 'manage_org_nfc_tags', 'Manage NFC tags within own organization', 'nfc_tags'),
        ('admin', 'view_org_statistics', 'View statistics for own organization', 'system'),
        ('admin', 'manage_org_settings', 'Manage organization settings', 'organizations'),
        ('admin', 'manage_org_appraisals', 'Manage appraisals within own organization', 'appraisals'),
        ('admin', 'grant_cross_org_permissions', 'Grant cross-organizational permissions', 'users'),

        -- Issuer permissions
        ('issuer', 'manage_nfc_tags', 'Create and manage NFC tags', 'nfc_tags'),
        ('issuer', 'attach_nfc_tags', 'Attach NFC tags to artworks', 'nfc_tags'),
        ('issuer', 'view_own_artworks', 'View artworks they have access to', 'artworks'),
        ('issuer', 'create_artworks', 'Create new artwork records', 'artworks'),

        -- Appraiser permissions
        ('appraiser', 'create_appraisals', 'Create appraisal records', 'appraisals'),
        ('appraiser', 'update_appraisals', 'Update existing appraisal records', 'appraisals'),
        ('appraiser', 'view_artwork_details', 'View detailed artwork information', 'artworks'),

        -- Staff permissions
        ('staff', 'manage_artworks', 'Create and update artwork records', 'artworks'),
        ('staff', 'view_artworks', 'View artwork information', 'artworks'),
        ('staff', 'manage_appraisals', 'Create and update appraisal records', 'appraisals'),
        ('staff', 'view_statistics', 'View basic statistics', 'system'),

        -- Viewer permissions
        ('viewer', 'view_artworks', 'View basic artwork information', 'artworks'),
        ('viewer', 'view_public_statistics', 'View public statistics', 'system');
        
        RAISE NOTICE 'Inserted % role permissions', (SELECT COUNT(*) FROM public.role_permissions);
    END IF;
END $$;

-- ============================================================================
-- 10. VIEWS AND FUNCTIONS
-- ============================================================================

-- Views for easier access control queries
CREATE OR REPLACE VIEW public.user_effective_permissions AS
SELECT DISTINCT
  ou.user_id,
  ou.organization_id,
  ou.role::text as role,
  rp.permission,
  rp.category,
  'direct' as permission_source
FROM public.organization_users ou
JOIN public.role_permissions rp ON rp.role = ou.role
WHERE ou.is_active = true AND rp.is_active = true

UNION ALL

SELECT DISTINCT
  cop.user_id,
  cop.organization_id,
  NULL as role,
  unnest(cop.permissions) as permission,
  'cross_org' as category,
  'cross_org' as permission_source
FROM public.cross_org_permissions cop
WHERE cop.is_active = true 
  AND (cop.expires_at IS NULL OR cop.expires_at > now());

-- View to get user's organizations
CREATE OR REPLACE VIEW public.user_organizations AS
SELECT 
  ou.user_id,
  o.*,
  ou.role as user_role,
  ou.is_primary,
  ou.permissions as additional_permissions,
  ou.is_active as membership_active
FROM public.organization_users ou
JOIN public.organizations o ON o.id = ou.organization_id
WHERE ou.is_active = true AND o.is_active = true;

-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_org_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
DO $$ BEGIN
    CREATE POLICY "Enable read access for authenticated users" ON public.role_permissions
      FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy already exists: Enable read access for authenticated users on role_permissions';
END $$;

-- ============================================================================
-- 12. SEED DATA FOR MIGRATION
-- ============================================================================

-- Insert a default system organization for existing data
DO $$
DECLARE
  default_org_id uuid;
  first_user_id uuid;
  affected_rows integer;
BEGIN
  -- Check if default organization already exists
  SELECT id INTO default_org_id FROM public.organizations WHERE name = 'Default Organization';
  
  IF default_org_id IS NULL THEN
    -- Get the first user to set as creator
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Insert default organization
    INSERT INTO public.organizations (name, type, description, is_active, created_by)
    VALUES (
      'Default Organization',
      'other',
      'Default organization for existing data migration',
      true,
      first_user_id
    ) RETURNING id INTO default_org_id;
    
    RAISE NOTICE 'Created default organization with ID: %', default_org_id;
  ELSE
    RAISE NOTICE 'Default organization already exists with ID: %', default_org_id;
  END IF;
  
  -- Update existing artworks to belong to default organization (only if they don't have one)
  UPDATE public.artworks 
  SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % artworks with default organization', affected_rows;
  
  -- Update existing tags to belong to default organization (only if they don't have one)
  UPDATE public.tags 
  SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % tags with default organization', affected_rows;
  
  -- Update existing profiles to belong to default organization (only if they don't have one)
  UPDATE public.profiles 
  SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles with default organization', affected_rows;
  
  -- Create organization memberships for existing users (only if they don't have any)
  INSERT INTO public.organization_users (organization_id, user_id, role, is_primary, is_active)
  SELECT 
    default_org_id,
    p.id,
    p.role,
    true,
    p.is_active
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_users ou 
    WHERE ou.user_id = p.id
  );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Created % organization memberships for existing users', affected_rows;
  
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- Organizations table: created';
  RAISE NOTICE '- Organization users table: created';
  RAISE NOTICE '- Cross org permissions table: created';
  RAISE NOTICE '- Role permissions: % entries', (SELECT COUNT(*) FROM public.role_permissions);
  RAISE NOTICE '- Default organization: %', default_org_id;
  
END $$;