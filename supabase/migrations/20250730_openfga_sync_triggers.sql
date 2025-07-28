-- Create OpenFGA synchronization triggers
-- These triggers will call webhook endpoints to sync data with OpenFGA

-- First, create a table to store sync events (for debugging and monitoring)
CREATE TABLE IF NOT EXISTS openfga_sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    organization_id UUID,
    user_id UUID,
    sync_data JSONB,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Create index for monitoring
CREATE INDEX IF NOT EXISTS idx_openfga_sync_events_status ON openfga_sync_events(status);
CREATE INDEX IF NOT EXISTS idx_openfga_sync_events_created_at ON openfga_sync_events(created_at);

-- Enable RLS
ALTER TABLE openfga_sync_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can view sync events
CREATE POLICY "Authenticated users can view sync events" ON openfga_sync_events
    FOR SELECT TO authenticated
    USING (true);

-- Function to queue OpenFGA sync events
CREATE OR REPLACE FUNCTION queue_openfga_sync(
    p_event_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_organization_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_sync_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    sync_event_id UUID;
BEGIN
    INSERT INTO openfga_sync_events (
        event_type,
        resource_type,
        resource_id,
        organization_id,
        user_id,
        sync_data
    ) VALUES (
        p_event_type,
        p_resource_type,
        p_resource_id,
        p_organization_id,
        p_user_id,
        p_sync_data
    ) RETURNING id INTO sync_event_id;
    
    -- In a production setup, you would call a webhook or queue system here
    -- For now, we'll just log the event
    RAISE NOTICE 'OpenFGA sync queued: % % % (ID: %)', p_event_type, p_resource_type, p_resource_id, sync_event_id;
    
    RETURN sync_event_id;
END;
$$ LANGUAGE plpgsql;

-- Artwork synchronization triggers
CREATE OR REPLACE FUNCTION sync_artwork_changes() RETURNS TRIGGER AS $$
BEGIN
    -- Handle artwork creation
    IF TG_OP = 'INSERT' THEN
        PERFORM queue_openfga_sync(
            'create',
            'artwork',
            NEW.id::TEXT,
            NEW.organization_id,
            NEW.created_by,
            jsonb_build_object(
                'title', NEW.title,
                'artist', NEW.artist,
                'organization_id', NEW.organization_id
            )
        );
        RETURN NEW;
    END IF;
    
    -- Handle artwork updates (organization transfer)
    IF TG_OP = 'UPDATE' THEN
        -- Only sync if organization changes
        IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
            PERFORM queue_openfga_sync(
                'transfer',
                'artwork',
                NEW.id::TEXT,
                NEW.organization_id,
                NEW.updated_by,
                jsonb_build_object(
                    'old_organization_id', OLD.organization_id,
                    'new_organization_id', NEW.organization_id
                )
            );
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle artwork deletion
    IF TG_OP = 'DELETE' THEN
        PERFORM queue_openfga_sync(
            'delete',
            'artwork',
            OLD.id::TEXT,
            OLD.organization_id,
            NULL,
            jsonb_build_object('organization_id', OLD.organization_id)
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create artwork triggers
DROP TRIGGER IF EXISTS trigger_sync_artwork_changes ON artworks;
CREATE TRIGGER trigger_sync_artwork_changes
    AFTER INSERT OR UPDATE OR DELETE ON artworks
    FOR EACH ROW EXECUTE FUNCTION sync_artwork_changes();

-- Organization user synchronization triggers
CREATE OR REPLACE FUNCTION sync_organization_user_changes() RETURNS TRIGGER AS $$
BEGIN
    -- Handle user addition to organization
    IF TG_OP = 'INSERT' THEN
        PERFORM queue_openfga_sync(
            'user_add',
            'organization_user',
            (NEW.user_id::TEXT || '_' || NEW.organization_id::TEXT),
            NEW.organization_id,
            NEW.user_id,
            jsonb_build_object(
                'role', NEW.role,
                'is_active', NEW.is_active
            )
        );
        RETURN NEW;
    END IF;
    
    -- Handle role changes
    IF TG_OP = 'UPDATE' THEN
        -- Sync if role changes or active status changes
        IF OLD.role IS DISTINCT FROM NEW.role OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            IF NEW.is_active THEN
                PERFORM queue_openfga_sync(
                    'user_role_update',
                    'organization_user',
                    (NEW.user_id::TEXT || '_' || NEW.organization_id::TEXT),
                    NEW.organization_id,
                    NEW.user_id,
                    jsonb_build_object(
                        'old_role', OLD.role,
                        'new_role', NEW.role,
                        'is_active', NEW.is_active
                    )
                );
            ELSE
                -- User deactivated
                PERFORM queue_openfga_sync(
                    'user_remove',
                    'organization_user',
                    (NEW.user_id::TEXT || '_' || NEW.organization_id::TEXT),
                    NEW.organization_id,
                    NEW.user_id,
                    jsonb_build_object('deactivated', true)
                );
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle user removal from organization
    IF TG_OP = 'DELETE' THEN
        PERFORM queue_openfga_sync(
            'user_remove',
            'organization_user',
            (OLD.user_id::TEXT || '_' || OLD.organization_id::TEXT),
            OLD.organization_id,
            OLD.user_id,
            jsonb_build_object('deleted', true)
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create organization user triggers
DROP TRIGGER IF EXISTS trigger_sync_organization_user_changes ON organization_users;
CREATE TRIGGER trigger_sync_organization_user_changes
    AFTER INSERT OR UPDATE OR DELETE ON organization_users
    FOR EACH ROW EXECUTE FUNCTION sync_organization_user_changes();

-- Appraisal synchronization triggers
CREATE OR REPLACE FUNCTION sync_appraisal_changes() RETURNS TRIGGER AS $$
BEGIN
    -- Handle appraisal creation
    IF TG_OP = 'INSERT' THEN
        PERFORM queue_openfga_sync(
            'create',
            'appraisal',
            NEW.id::TEXT,
            (SELECT organization_id FROM artworks WHERE id = NEW.artwork_id),
            NEW.created_by,
            jsonb_build_object(
                'artwork_id', NEW.artwork_id,
                'appraised_value', NEW.appraised_value
            )
        );
        RETURN NEW;
    END IF;
    
    -- Handle appraisal deletion
    IF TG_OP = 'DELETE' THEN
        PERFORM queue_openfga_sync(
            'delete',
            'appraisal',
            OLD.id::TEXT,
            (SELECT organization_id FROM artworks WHERE id = OLD.artwork_id),
            NULL,
            jsonb_build_object('artwork_id', OLD.artwork_id)
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create appraisal triggers (assuming the table exists)
DROP TRIGGER IF EXISTS trigger_sync_appraisal_changes ON artwork_appraisals;
CREATE TRIGGER trigger_sync_appraisal_changes
    AFTER INSERT OR DELETE ON artwork_appraisals
    FOR EACH ROW EXECUTE FUNCTION sync_appraisal_changes();

-- Organization creation trigger
CREATE OR REPLACE FUNCTION sync_organization_changes() RETURNS TRIGGER AS $$
BEGIN
    -- Handle organization creation
    IF TG_OP = 'INSERT' THEN
        PERFORM queue_openfga_sync(
            'create',
            'organization',
            NEW.id::TEXT,
            NEW.id,
            NEW.created_by,
            jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type
            )
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create organization triggers
DROP TRIGGER IF EXISTS trigger_sync_organization_changes ON organizations;
CREATE TRIGGER trigger_sync_organization_changes
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION sync_organization_changes();

-- Function to manually mark sync events as processed
CREATE OR REPLACE FUNCTION mark_sync_event_processed(
    p_event_id UUID,
    p_status TEXT DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE openfga_sync_events 
    SET 
        status = p_status,
        error_message = p_error_message,
        synced_at = NOW()
    WHERE id = p_event_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending sync events
CREATE OR REPLACE FUNCTION get_pending_sync_events(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    event_type TEXT,
    resource_type TEXT,
    resource_id TEXT,
    organization_id UUID,
    user_id UUID,
    sync_data JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.event_type,
        e.resource_type,
        e.resource_id,
        e.organization_id,
        e.user_id,
        e.sync_data,
        e.created_at
    FROM openfga_sync_events e
    WHERE e.status = 'pending'
    ORDER BY e.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT ON openfga_sync_events TO authenticated;
GRANT EXECUTE ON FUNCTION queue_openfga_sync TO authenticated;
GRANT EXECUTE ON FUNCTION mark_sync_event_processed TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_sync_events TO authenticated;