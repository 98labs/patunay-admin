# Fix for Login Issues

## Problem Identified

The login was failing because:
1. The `profiles` table exists but there's no trigger to automatically create profile records when users sign up
2. The `handle_new_user` function and trigger are missing from the current schema
3. Users can authenticate via Supabase Auth but have no corresponding profile record, causing the app to fail

## Solution

### 1. Apply the Database Migration

Run the following SQL in your Supabase SQL editor:

```bash
# Copy the contents of this file:
supabase/fix-auth-profiles.sql
```

This migration:
- Creates the `handle_new_user` function
- Creates a trigger that automatically creates profile records for new users
- Fixes any existing users who don't have profiles
- Sets up proper error handling

### 2. Create Test Users (Optional)

If you need test users for development:

```bash
# First, ensure you have the required environment variables set
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY

# Note: These environment variables should be set in your shell, 
# not in the application's .env file, for security reasons.

# Install dependencies if needed
npm install @supabase/supabase-js dotenv

# Run the script
SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-test-users.js
```

This will create:
- **Admin user**: admin@patunay.com / admin123
- **Staff user**: staff@patunay.com / staff123

### 3. Alternative: Manual User Creation

If you prefer to create users manually:

1. Go to your Supabase dashboard
2. Navigate to Authentication → Users
3. Click "Add user" and create a user
4. The trigger will automatically create their profile
5. To make them admin, run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
   ```

## Verification

After applying the fix:

1. Try logging in with your credentials
2. Check that a profile record exists:
   ```sql
   SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
   ```
3. The app should now work correctly

## Root Cause

The issue occurred because the `handle_new_user` function that creates profile records for new auth users was not included in the main schema file. This is a common issue when using Supabase Auth with custom profile tables.