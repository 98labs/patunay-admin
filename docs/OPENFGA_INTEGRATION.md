# OpenFGA Integration Guide

This guide explains how to set up and use OpenFGA for fine-grained authorization in the Patunay Admin application.

## Overview

OpenFGA (Fine-Grained Authorization) provides a flexible, relationship-based authorization system that complements our existing Supabase authentication. It enables:

- Multi-tenant authorization with organization-scoped permissions
- Role-based access control (RBAC)
- Resource-specific permissions
- Cross-organizational permissions for special roles (issuer, appraiser)

## Setup

### 1. Start OpenFGA Server

```bash
# Start the OpenFGA server and PostgreSQL database
docker-compose up -d
```

This will start:
- OpenFGA server on `http://localhost:8080`
- OpenFGA playground on `http://localhost:3000`
- PostgreSQL database on `localhost:5432`

### 2. Initialize OpenFGA

```bash
# Run the setup script to create store and model
node scripts/setup-openfga.js
```

This script will:
- Create an OpenFGA store
- Upload the authorization model
- Create sample data
- Output the store ID and model ID

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```env
VITE_OPENFGA_API_URL=http://localhost:8080
VITE_OPENFGA_STORE_ID=<store-id-from-setup>
VITE_OPENFGA_MODEL_ID=<model-id-from-setup>
```

## Authorization Model

Our OpenFGA model supports the following entities and relationships:

### Organizations
- **Roles**: super_admin, admin, staff, viewer, issuer, appraiser
- **Relations**: member (computed from all roles)

### Resources
- **Artwork**: can_view, can_create, can_update, can_delete
- **Appraisal**: can_view, can_create, can_update, can_delete
- **NFC Tag**: can_view, can_attach, can_detach
- **User Management**: can_manage_users, can_invite_users, can_remove_users, can_update_roles
- **Organization Settings**: can_view, can_update

### Global System
- **super_user**: Can access all organizations and system settings

## Usage

### React Hooks

#### `useOpenFGA()`
Main hook for permission checking:

```typescript
const { check, checkRole, batchCheck, listUserOrganizations } = useOpenFGA();

// Check specific permission
const canCreateArtwork = await check('create_artwork', undefined, orgId);

// Check role
const isAdmin = await checkRole('admin', orgId);

// Batch check multiple permissions
const permissions = await batchCheck([
  { permission: 'view_artworks', orgId },
  { permission: 'create_artwork', orgId },
]);
```

#### `useCanPerform()`
Hook for permission-based rendering:

```typescript
const { can, loading } = useCanPerform('manage_users', undefined, orgId);

if (loading) return <Spinner />;
if (!can) return <Unauthorized />;
```

#### `useHasRole()`
Hook for role-based rendering:

```typescript
const { can: isAdmin, loading } = useHasRole('admin', orgId);
```

### Components

#### `OpenFGAPermissionGuard`
Component for conditional rendering based on permissions:

```tsx
<OpenFGAPermissionGuard 
  permission="manage_users" 
  organizationId={orgId}
  fallback={<Unauthorized />}
>
  <UserManagementPanel />
</OpenFGAPermissionGuard>
```

#### `withOpenFGAAccess` HOC
Higher-order component for page-level protection:

```tsx
export default withOpenFGAAccess(AdminPage, {
  role: 'admin',
  permission: 'manage_users',
  redirectTo: '/unauthorized',
});
```

## Migration Strategy

To migrate from the existing permission system to OpenFGA:

1. **Parallel Operation**: Both systems can run in parallel during migration
2. **Gradual Migration**: Migrate one feature at a time
3. **Data Sync**: Use the sync service to keep OpenFGA in sync with Supabase

### Example Migration

Replace existing permission check:

```typescript
// Old
if (hasPermission('manage_users', orgId)) {
  // ...
}

// New
const { can } = useCanPerform('manage_users', undefined, orgId);
if (can) {
  // ...
}
```

## Data Synchronization

The sync service keeps OpenFGA in sync with your Supabase database:

```typescript
// When a user is assigned a role
await syncUserRole(userId, orgId, role);

// When a resource is created
await syncResourceCreation('artwork', artworkId, orgId);

// When permissions are updated
await syncPermissionUpdate(userId, permission, resourceId);
```

## Testing

### Manual Testing

1. Access the OpenFGA playground at `http://localhost:3000`
2. Use the provided test data to verify permissions
3. Test different user-role-resource combinations

### Automated Testing

```typescript
// Example test
describe('OpenFGA Integration', () => {
  it('should allow admin to manage users', async () => {
    const result = await openFGA.check({
      user: 'user:admin123',
      relation: 'can_manage_users',
      object: 'user_management:org123',
    });
    expect(result).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure Docker containers are running: `docker-compose ps`
   - Check OpenFGA logs: `docker-compose logs openfga`

2. **Invalid Store/Model ID**
   - Re-run the setup script: `node scripts/setup-openfga.js`
   - Update environment variables with new IDs

3. **Permission Denied**
   - Check the authorization model for correct relations
   - Verify tuples are properly written to OpenFGA
   - Use the playground to debug permission chains

### Debug Mode

Enable debug logging by setting:

```typescript
// In your app initialization
if (process.env.NODE_ENV === 'development') {
  window.DEBUG_OPENFGA = true;
}
```

## Best Practices

1. **Minimize Permission Checks**: Use batch operations when checking multiple permissions
2. **Cache Results**: Consider caching permission results for better performance
3. **Audit Trail**: Log all permission changes for security auditing
4. **Test Thoroughly**: Always test permission changes in development first
5. **Gradual Rollout**: Use feature flags to control the OpenFGA rollout

## Resources

- [OpenFGA Documentation](https://openfga.dev/docs)
- [OpenFGA Playground](http://localhost:3000) (when running locally)
- [Authorization Model Language](https://openfga.dev/docs/configuration-language)
- [SDK Reference](https://openfga.dev/docs/sdks/javascript)