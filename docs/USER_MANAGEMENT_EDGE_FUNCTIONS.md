# User Management with Supabase Edge Functions

This document describes the new user and role management system implemented using Supabase Edge Functions.

## Overview

The user management system has been migrated from database RPC functions to Supabase Edge Functions for better security and flexibility. Edge Functions run on Deno Deploy and provide a secure server-side environment for handling sensitive operations.

## Architecture

### Edge Functions

1. **user-management** - Handles all user CRUD operations
2. **role-management** - Handles role assignments and permissions

### Frontend Integration

- `src/ui/services/edgeFunctions.ts` - Service layer for calling Edge Functions
- `src/ui/store/api/userManagementApiV2.ts` - RTK Query API using Edge Functions

## Features

### User Management
- ✅ Create users with profiles and initial permissions
- ✅ Update user information
- ✅ Disable/enable users (with auth ban/unban)
- ✅ Delete users permanently
- ✅ List users with filtering and pagination
- ✅ Get individual user details

### Role Management
- ✅ Assign roles to users
- ✅ Revoke roles (reset to default 'staff')
- ✅ Grant specific permissions
- ✅ Revoke specific permissions
- ✅ List user permissions (default + explicit)

## Security

- All operations require admin or super_user role
- Authentication via Supabase JWT tokens
- Service role key used for auth.admin operations
- Role-based permission system

## Deployment

### Prerequisites
- Supabase CLI installed
- Access to Supabase project

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy user-management
supabase functions deploy role-management
```

### Environment Variables

Edge Functions automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

### Frontend Configuration

Ensure your `.env` file has:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Migration from RPC Functions

### Removed Database Functions
- `create_user_with_profile`
- `update_user_profile`
- `soft_delete_user`
- `grant_user_permission`
- `revoke_user_permission`

### Updated Frontend Code
- Replaced `userManagementApi.ts` with `userManagementApiV2.ts`
- Updated `UserManagement.tsx` to use new API hooks
- Added `edgeFunctions.ts` service layer

## Testing

### Local Development

```bash
# Start Supabase locally
supabase start

# Serve Edge Functions
supabase functions serve

# Run frontend with local Supabase
npm run dev
```

### Unit Tests

```bash
# Run Edge Functions service tests
npm test src/ui/services/edgeFunctions.test.ts
```

### Manual Testing

1. Login as admin user
2. Navigate to User Management
3. Test operations:
   - Create new user
   - Update user details
   - Disable/enable user
   - Change user role
   - Delete user

## Roles and Permissions

### Available Roles
- `super_user` - Full system access
- `admin` - User and content management
- `issuer` - Create and manage artworks
- `appraiser` - Appraise artworks
- `staff` - Basic read access
- `viewer` - Limited read access

### Permission Structure
Each role has default permissions. Additional permissions can be granted explicitly.

Example permissions:
- `users.create`
- `users.read`
- `users.update`
- `users.delete`
- `roles.assign`
- `permissions.grant`
- `artworks.create`
- `artworks.update`
- `nfc.write`

## Troubleshooting

### Common Issues

1. **403 Forbidden** - User lacks admin/super_user role
2. **Edge Function not found** - Deploy the functions first
3. **CORS errors** - Check CORS headers in Edge Functions

### Debug Mode

Enable debug logging:
```typescript
// In edgeFunctions.ts
console.log('Edge function request:', functionName, body);
console.log('Edge function response:', result);
```

## Future Enhancements

- [ ] Batch user operations
- [ ] User import/export
- [ ] Audit logging
- [ ] Custom role creation
- [ ] Permission templates
- [ ] API rate limiting