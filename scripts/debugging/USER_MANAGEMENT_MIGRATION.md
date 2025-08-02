# User Management Migration Guide

## Overview
This guide helps you set up the required database tables and permissions for the User Management feature.

## Prerequisites
- Supabase project with admin access
- Service role key configured in your environment variables

## Migration Steps

### 1. Create Profiles Table
Run the following SQL script in your Supabase SQL editor:

```bash
# The script is located at:
scripts/debugging/create-profiles-table.sql
```

This script will:
- Create the `profiles` table if it doesn't exist
- Set up proper indexes for performance
- Enable Row Level Security (RLS)
- Create policies for user access control
- Set up triggers for automatic profile creation
- Grant necessary permissions

### 2. Set Up Storage Buckets (if not already done)
If you haven't already set up the storage buckets for user avatars, run:

```bash
# The script is located at:
docs/supabase-storage-setup-user-avatars.sql
```

### 3. Verify Environment Variables
Ensure you have the following environment variables set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Note: Service role key is no longer used in the client application for security reasons. User creation is now handled through Supabase Edge Functions.

### 4. Test the Setup
After running the migrations:

1. Restart your development server
2. Navigate to the User Management page
3. The page should load without errors
4. You should be able to create, edit, and delete users

## Troubleshooting

### "500 Internal Server Error" when fetching profiles
- Run the `create-profiles-table.sql` script
- Ensure your user has admin role in the profiles table
- Check that RLS policies are properly configured

### "Permission denied" errors
- Ensure the authenticated user has admin role
- Check RLS policies are active
- Verify the Edge Function is deployed for user creation

### Console errors about undefined supabase
- This has been fixed in the latest code
- Ensure you've pulled the latest changes

## Additional Notes
- The profiles table uses UUID references to auth.users
- Cascade deletion is set up - deleting an auth user will delete their profile
- The `updated_at` field is automatically maintained via trigger
- User roles are: 'admin', 'staff', 'appraiser'