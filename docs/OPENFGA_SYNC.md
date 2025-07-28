# OpenFGA Data Synchronization

This document explains how the application synchronizes data between Supabase and OpenFGA for authorization.

## Overview

The synchronization system ensures that authorization data in OpenFGA stays consistent with the application data in Supabase. It consists of several components:

1. **Automatic Sync Hooks** - React hooks that sync data during CRUD operations
2. **Database Triggers** - PostgreSQL triggers that queue sync events
3. **Background Processor** - Service that processes queued sync events
4. **Monitoring System** - Components to monitor sync status and handle errors

## Architecture

```
Supabase Database
       ↓ (triggers)
   Sync Events Queue
       ↓ (processor)
    OpenFGA API
```

## Components

### 1. Sync Hooks

#### `useOpenFGASync()`
Automatically syncs user permissions when they authenticate:
- Syncs super user status
- Syncs organization memberships and roles

**Usage:** Already integrated in `DashboardLayout.tsx`

#### `useArtworkWithSync()`
Enhanced artwork operations with OpenFGA sync:
```typescript
import { useArtworkWithSync } from '../hooks/useArtworkWithSync';

const { createArtwork, updateArtwork, deleteArtwork } = useArtworkWithSync();

// Create artwork (automatically synced)
await createArtwork({ artwork: artworkData });
```

#### `useOrganizationWithSync()`
Enhanced organization operations with OpenFGA sync:
```typescript
import { useOrganizationWithSync } from '../hooks/useOrganizationWithSync';

const { createOrganization, updateOrganization } = useOrganizationWithSync();

// Create organization (automatically synced)
await createOrganization(organizationData);
```

#### `useOrganizationUserSync()`
Manage organization user relationships:
```typescript
import { useOrganizationUserSync } from '../hooks/useOrganizationWithSync';

const { addUserToOrganization, updateUserRole, removeUserFromOrganization } = useOrganizationUserSync();

// Add user to organization with role
await addUserToOrganization(userId, orgId, 'admin');
```

### 2. Database Triggers

The following triggers automatically queue sync events:

- **Artwork Changes**: `trigger_sync_artwork_changes`
  - Syncs artwork creation, updates (org transfers), and deletion
- **Organization Users**: `trigger_sync_organization_user_changes` 
  - Syncs user additions, role changes, and removals
- **Appraisals**: `trigger_sync_appraisal_changes`
  - Syncs appraisal creation and deletion
- **Organizations**: `trigger_sync_organization_changes`
  - Syncs organization creation

### 3. Background Processor

The `OpenFGASyncProcessor` runs continuously and processes queued sync events:

```typescript
import { syncProcessor } from '../services/openfga/syncProcessor';

// Manually trigger processing (for debugging)
await syncProcessor.processAllPending();
```

**Features:**
- Processes events in batches (10 at a time)
- Runs every 5 seconds
- Handles failures and retries
- Logs progress and errors

### 4. Monitoring and Error Handling

#### Sync Status Monitoring
```typescript
import { useOpenFGASyncMonitoring } from '../hooks/useOpenFGASyncMonitoring';

const {
  syncStats,        // { total, pending, success, failed, recentEvents }
  isLoading,
  error,
  fetchSyncStats,
  retryFailedEvent,
} = useOpenFGASyncMonitoring();
```

#### Sync Status Component
```tsx
import OpenFGASyncStatus from '../components/OpenFGASyncStatus';

// Basic status display
<OpenFGASyncStatus />

// Detailed status with event list
<OpenFGASyncStatus showDetails={true} />
```

#### Error Handling
```typescript
import { useOpenFGASyncErrorHandler } from '../hooks/useOpenFGASyncMonitoring';

const {
  syncErrors,
  addSyncError,
  clearSyncError,
} = useOpenFGASyncErrorHandler();

// Add error notification
addSyncError('Failed to sync artwork creation', eventId);
```

## Database Schema

### Sync Events Table
```sql
CREATE TABLE openfga_sync_events (
    id UUID PRIMARY KEY,
    event_type TEXT NOT NULL,          -- 'create', 'update', 'delete', etc.
    resource_type TEXT NOT NULL,       -- 'artwork', 'organization_user', etc.
    resource_id TEXT NOT NULL,
    organization_id UUID,
    user_id UUID,
    sync_data JSONB,                   -- Additional data for sync
    status TEXT DEFAULT 'pending',     -- 'pending', 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);
```

### Utility Functions
- `queue_openfga_sync()` - Queue a sync event
- `mark_sync_event_processed()` - Mark event as processed
- `get_pending_sync_events()` - Get pending events

## Usage Examples

### 1. Using Enhanced Artwork Operations

```tsx
import React from 'react';
import { useArtworkWithSync } from '../hooks/useArtworkWithSync';

export function ArtworkManager() {
  const { createArtwork, deleteArtwork } = useArtworkWithSync();

  const handleCreateArtwork = async (artworkData) => {
    try {
      // This will create the artwork AND sync with OpenFGA
      const result = await createArtwork({ artwork: artworkData });
      console.log('Artwork created and synced:', result.data.id);
    } catch (error) {
      console.error('Failed to create artwork:', error);
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    try {
      // This will delete the artwork AND remove OpenFGA relationships
      await deleteArtwork({ id: artworkId });
      console.log('Artwork deleted and synced');
    } catch (error) {
      console.error('Failed to delete artwork:', error);
    }
  };

  return (
    <div>
      {/* Your artwork management UI */}
    </div>
  );
}
```

### 2. Adding Sync Status to Admin Panel

```tsx
import React from 'react';
import OpenFGASyncStatus from '../components/OpenFGASyncStatus';

export function AdminPanel() {
  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      
      {/* Show sync status */}
      <OpenFGASyncStatus 
        className="mb-6" 
        showDetails={true} 
      />
      
      {/* Rest of admin content */}
    </div>
  );
}
```

### 3. Manual Organization User Management

```tsx
import React from 'react';
import { useOrganizationUserSync } from '../hooks/useOrganizationWithSync';

export function UserManagement() {
  const { addUserToOrganization, updateUserRole } = useOrganizationUserSync();

  const handleAddUser = async (userId, orgId) => {
    try {
      // Add user as viewer and sync with OpenFGA
      await addUserToOrganization(userId, orgId, 'viewer');
      console.log('User added and permissions synced');
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const handlePromoteUser = async (userId, orgId) => {
    try {
      // Update user role to admin and sync with OpenFGA
      await updateUserRole(userId, orgId, 'admin');
      console.log('User promoted and permissions synced');
    } catch (error) {
      console.error('Failed to promote user:', error);
    }
  };

  return (
    <div>
      {/* Your user management UI */}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Sync Events Stuck in Pending**
   - Check OpenFGA service is running
   - Verify network connectivity
   - Check sync processor logs

2. **Failed Sync Events**
   - Review error messages in `openfga_sync_events` table
   - Use retry functionality in sync status component
   - Check OpenFGA authorization model is properly configured

3. **Performance Issues**
   - Monitor sync event queue size
   - Adjust processor batch size if needed
   - Consider adding more indices to sync events table

### Debugging

1. **View All Sync Events**
   ```sql
   SELECT * FROM openfga_sync_events 
   ORDER BY created_at DESC 
   LIMIT 50;
   ```

2. **Check Failed Events**
   ```sql
   SELECT * FROM openfga_sync_events 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

3. **Monitor Processor Logs**
   Check browser console for sync processor logs starting with:
   - `🔄 Processing sync event:`
   - `✅ Marked sync event`
   - `❌ Failed to process sync event`

## Configuration

### Environment Variables
- `REACT_APP_OPENFGA_API_URL` - OpenFGA API endpoint
- `REACT_APP_OPENFGA_STORE_ID` - OpenFGA store ID
- `REACT_APP_OPENFGA_AUTH_MODEL_ID` - OpenFGA authorization model ID

### Processor Settings
Adjust in `syncProcessor.ts`:
- `BATCH_SIZE` - Number of events to process at once (default: 10)
- `PROCESS_INTERVAL` - Processing interval in ms (default: 5000)

## Next Steps

1. **Webhook Integration**: Replace the current trigger-based system with webhooks for real-time sync
2. **Retry Logic**: Implement exponential backoff for failed sync events
3. **Metrics**: Add more detailed metrics and alerting
4. **Testing**: Add integration tests for sync functionality