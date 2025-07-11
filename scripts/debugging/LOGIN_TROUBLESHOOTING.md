# Login Troubleshooting Guide

## Error: 500 Internal Server Error on Login

### Symptoms
- Login fails with a 500 error from `https://euimnkqawovkzyrirnnm.supabase.co/auth/v1/token?grant_type=password`
- User cannot authenticate despite correct credentials

### Possible Causes

1. **Missing Profile Record**
   - User exists in `auth.users` but not in `public.profiles`
   - The `handle_new_user()` trigger might not have fired when user was created

2. **Database Connection Issues**
   - Supabase project might be paused or experiencing issues
   - Database connection pool might be exhausted

3. **Authentication Configuration**
   - Email auth might be disabled in Supabase dashboard
   - Password requirements might not be met

4. **RLS Policies**
   - Row Level Security policies might be blocking the profile creation

### Diagnostic Steps

1. **Use Auth Diagnostic Tool**
   - Click "Show Auth Diagnostic" button on login page
   - Run the diagnostic to check various auth components

2. **Check Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Check Authentication > Settings > Auth Providers
   - Ensure "Email" provider is enabled

3. **Check Database**
   - Run the SQL in `/archive/fix-user-login.sql` to check if user profile exists
   - This will create the profile if missing

### Solutions

#### Solution 1: Create Missing Profile
```sql
-- Run this in Supabase SQL Editor
INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at)
SELECT 
    au.id,
    split_part(au.email, '@', 1),
    '',
    'admin'::user_role,
    true,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'brian.tanseng@gmail.com'
AND p.id IS NULL;
```

#### Solution 2: Reset User Password
If the profile exists but login still fails:
1. Go to Supabase Dashboard > Authentication > Users
2. Find the user and click "Send Password Reset"
3. Check email and reset password

#### Solution 3: Check Supabase Status
1. Visit https://status.supabase.com/
2. Check if there are any ongoing incidents
3. If your project is paused, unpause it from the dashboard

#### Solution 4: Enable Email Auth
1. Go to Supabase Dashboard > Authentication > Providers
2. Ensure "Email" is enabled
3. Check email settings (SMTP configuration if custom)

### Temporary Workaround
If urgent access is needed:
1. Create a new user via Supabase dashboard
2. Manually insert a profile record for that user
3. Use those credentials to login

### Prevention
Ensure the auth trigger is properly set up:
```sql
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Additional Debugging
1. Check browser console for detailed error messages
2. Check Supabase project logs in the dashboard
3. Use the Auth Diagnostic tool added to the login page