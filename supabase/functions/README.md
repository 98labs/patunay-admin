# Supabase Edge Functions

This directory contains Supabase Edge Functions for secure server-side operations.

## User Management Functions

### user-management

Handles all user CRUD operations with proper authentication and authorization.

**Endpoints:**
- `create` - Create a new user with profile and permissions
- `update` - Update user profile information
- `disable` - Disable a user account (bans the user)
- `enable` - Enable a disabled user account
- `delete` - Permanently delete a user
- `list` - List users with filtering and pagination
- `get` - Get a single user by ID

**Required permissions:** Admin or Super User role

### role-management

Handles role and permission management for users.

**Endpoints:**
- `assign` - Assign a role to a user
- `revoke` - Revoke a user's role (sets to default 'staff')
- `grant-permission` - Grant a specific permission to a user
- `revoke-permission` - Revoke a specific permission from a user
- `list-permissions` - List all permissions for a user

**Required permissions:** Admin or Super User role

## Deployment

To deploy Edge Functions:

```bash
# Deploy all functions
supabase functions deploy

# Deploy a specific function
supabase functions deploy user-management
supabase functions deploy role-management
```

## Testing

To test locally:

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve
```

## Environment Variables

The following environment variables are automatically available in Edge Functions:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anonymous key for public operations