# Authz Integration Guide

This guide explains how to integrate the new Zanzibar-style RBAC system with your existing application.

## 1. Protecting Routes

### Using AuthzGuard Component

```tsx
import { AuthzGuard } from '@components';

// Single permission check
<AuthzGuard 
  namespace="system" 
  objectId="global" 
  relation="user_manager"
  redirectTo="/dashboard"
>
  <UserManagement />
</AuthzGuard>

// Multiple permission checks (any)
<AuthzGuard 
  checks={[
    { namespace: 'system', objectId: 'global', relation: 'admin' },
    { namespace: 'system', objectId: 'global', relation: 'user_manager' }
  ]}
  requireAll={false}
>
  <UserManagement />
</AuthzGuard>

// Multiple permission checks (all required)
<AuthzGuard 
  checks={[
    { namespace: 'artwork', objectId: '*', relation: 'editor' },
    { namespace: 'nfc_tag', objectId: '*', relation: 'manager' }
  ]}
  requireAll={true}
>
  <ArtworkNFCManager />
</AuthzGuard>
```

### Using HOC for Route Protection

```tsx
import { withAuthz } from '@components';

// Protect a component
const ProtectedUserManagement = withAuthz(UserManagement, {
  namespace: 'system',
  objectId: 'global',
  relation: 'user_manager'
});

// In your router
<Route 
  path="/dashboard/admin/users" 
  element={<ProtectedUserManagement />} 
/>
```

### Update Router Example

```tsx
// src/ui/router/index.tsx
import { AuthzGuard } from '@components';

// Protect admin routes
<Route path="/dashboard/admin" element={
  <AuthzGuard namespace="system" objectId="global" relation="admin">
    <Outlet />
  </AuthzGuard>
}>
  <Route path="users" element={
    <AuthzGuard namespace="system" objectId="global" relation="user_manager">
      <UserManagement />
    </AuthzGuard>
  } />
</Route>

// Protect individual routes
<Route path="/dashboard/artworks" element={
  <AuthzGuard namespace="artwork" objectId="*" relation="viewer">
    <Artworks />
  </AuthzGuard>
} />
```

## 2. Conditional Rendering

### Using Can Components

```tsx
import { Can, CanAny, CanAll } from '@components';

// Single permission check
<Can namespace="system" objectId="global" relation="user_manager">
  <Button onClick={createUser}>Create User</Button>
</Can>

// Multiple permissions (any)
<CanAny checks={[
  { namespace: 'artwork', objectId: artworkId, relation: 'owner' },
  { namespace: 'artwork', objectId: artworkId, relation: 'editor' }
]}>
  <Button onClick={editArtwork}>Edit Artwork</Button>
</CanAny>

// Multiple permissions (all required)
<CanAll checks={[
  { namespace: 'artwork', objectId: '*', relation: 'editor' },
  { namespace: 'nfc_tag', objectId: '*', relation: 'manager' }
]}>
  <Button onClick={attachNFC}>Attach NFC Tag</Button>
</CanAll>

// With fallback
<Can 
  namespace="system" 
  objectId="global" 
  relation="admin"
  fallback={<span>Admin access required</span>}
>
  <AdminPanel />
</Can>
```

### In Sidebar Navigation

```tsx
// Update Sidebar component to filter links based on permissions
import { useFeaturePermissions } from '../hooks/useAuthz';

const Sidebar = () => {
  const { 
    canManageUsers, 
    canManageArtworks, 
    canViewStatistics,
    isLoading 
  } = useFeaturePermissions();

  const filteredLinks = links.filter(link => {
    switch (link.path) {
      case '/dashboard/admin/users':
        return canManageUsers;
      case '/dashboard/artworks':
        return canManageArtworks;
      case '/dashboard/statistics':
        return canViewStatistics;
      default:
        return true;
    }
  });

  // Render filtered links...
};
```

## 3. Using Hooks

### Check Single Permission

```tsx
import { useAuthzPermission } from '../hooks/useAuthz';

function ArtworkDetail({ artworkId }) {
  const { hasPermission, isLoading } = useAuthzPermission(
    'artwork', 
    artworkId, 
    'editor'
  );

  if (isLoading) return <Loading />;

  return (
    <div>
      {hasPermission && <EditButton />}
    </div>
  );
}
```

### Check Feature Permissions

```tsx
import { useFeaturePermissions } from '../hooks/useAuthz';

function Dashboard() {
  const { 
    canManageUsers,
    canManageArtworks,
    canViewStatistics,
    isSystemAdmin,
    isLoading 
  } = useFeaturePermissions();

  if (isLoading) return <Loading />;

  return (
    <div>
      {canViewStatistics && <StatsCard />}
      {canManageArtworks && <ArtworkQuickActions />}
      {isSystemAdmin && <SystemSettings />}
    </div>
  );
}
```

### Manage Permissions

```tsx
import { useAuthzManagement } from '../hooks/useAuthz';

function UserRoleManager({ userId }) {
  const { addUserToGroup, removeUserFromGroup, isLoading } = useAuthzManagement();

  const handleMakeAdmin = async () => {
    try {
      await addUserToGroup(userId, 'admins');
      // Show success message
    } catch (error) {
      // Handle error
    }
  };

  const handleRemoveAdmin = async () => {
    try {
      await removeUserFromGroup(userId, 'admins');
      // Show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      <Button 
        onClick={handleMakeAdmin} 
        disabled={isLoading}
      >
        Make Admin
      </Button>
      <Button 
        onClick={handleRemoveAdmin} 
        disabled={isLoading}
      >
        Remove Admin
      </Button>
    </div>
  );
}
```

## 4. Service Layer Usage

### Direct Service Calls

```tsx
import { authzService } from '../services/authz';

// Check permission
const canEdit = await authzService.check(
  'artwork', 
  artworkId, 
  'editor', 
  'user', 
  userId
);

// Grant permission
await authzService.grant(
  'artwork', 
  artworkId, 
  'owner', 
  'user', 
  userId
);

// Add user to group
await authzService.addUserToGroup(userId, 'staff');

// Check if current user is admin
const isAdmin = await authzService.isCurrentUserAdmin();
```

## 5. Migration from Legacy System

### Update useAuth Hook

```tsx
// Add authz checks to existing useAuth hook
import { authzService } from '../services/authz';

export function useAuth() {
  // ... existing code ...

  const hasPermission = useCallback(async (permission: string) => {
    if (!user) return false;
    
    // Use legacy permission check for backward compatibility
    return authzService.checkLegacyPermission(user.id, permission);
  }, [user]);

  const hasRole = useCallback(async (role: string) => {
    if (!user) return false;
    
    // Check group membership
    return authzService.isUserInGroup(user.id, role === 'admin' ? 'admins' : 'staff');
  }, [user]);

  // ... rest of the hook
}
```

### Update Existing Permission Checks

```tsx
// Before
if (hasPermission('manage_users')) {
  // Show user management
}

// After (using legacy compatibility)
const canManageUsers = await authzService.checkLegacyPermission(userId, 'manage_users');

// Or using new system directly
const canManageUsers = await authzService.check(
  'system', 
  'global', 
  'user_manager', 
  'user', 
  userId
);
```

## 6. Best Practices

1. **Use hooks for React components** - They handle loading states and reactivity
2. **Use service directly for non-React code** - API calls, utilities, etc.
3. **Prefer specific object IDs over wildcards** - `artwork:123` instead of `artwork:*` when possible
4. **Cache permission checks** - The hooks do this automatically
5. **Use batch checks for multiple permissions** - More efficient than individual checks
6. **Always handle loading states** - Permissions are async operations
7. **Provide meaningful fallbacks** - Show why access is denied

## 7. Common Patterns

### Resource-based Permissions

```tsx
// Check if user can edit specific artwork
const canEdit = await authzService.check(
  'artwork', 
  artworkId, 
  'editor', 
  'user', 
  userId
);

// Grant ownership when creating artwork
await authzService.grant(
  'artwork', 
  newArtworkId, 
  'owner', 
  'user', 
  creatorId
);
```

### Group-based Permissions

```tsx
// Add user to staff group
await authzService.addUserToGroup(userId, 'staff');

// Check if user is in admin group
const isAdmin = await authzService.isUserInGroup(userId, 'admins');

// Grant permission to entire group
await authzService.grant(
  'system', 
  'global', 
  'statistics_viewer', 
  'group', 
  'staff',
  'member'
);
```

### Hierarchical Permissions

```tsx
// Owner can do everything editor can do
// This is defined in the namespace configuration
// When checking for 'editor', owners will also have access

// Grant owner permission (includes editor and viewer)
await authzService.grant(
  'artwork', 
  artworkId, 
  'owner', 
  'user', 
  userId
);
```

## 8. Debugging

### Check Audit Logs

```sql
-- View recent permission checks
SELECT * FROM authz.audit_log 
WHERE operation = 'check' 
ORDER BY performed_at DESC 
LIMIT 50;

-- View permission grants/revokes for a user
SELECT * FROM authz.audit_log 
WHERE tuple_data->>'subject_id' = 'user-id-here'
AND operation IN ('grant', 'revoke')
ORDER BY performed_at DESC;
```

### View Current Permissions

```sql
-- View all permissions for a user
SELECT * FROM authz.expanded_permissions
WHERE subject_namespace = 'user'
AND subject_id = 'user-id-here';

-- View all users with specific permission
SELECT * FROM authz.expanded_permissions
WHERE namespace = 'system'
AND object_id = 'global'
AND relation = 'admin';
```

### Test Permissions

```tsx
// In browser console
const { authzService } = await import('/src/ui/services/authz');
const hasAccess = await authzService.checkCurrentUser('system', 'global', 'admin');
console.log('Is admin:', hasAccess);
```