# Fix for "Database error granting user" Login Error

## Quick Solution

Run this SQL in your Supabase SQL Editor:

```sql
-- 1. Create the missing trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Fix existing users without profiles
INSERT INTO public.profiles (id, first_name, last_name, role, is_active, created_at)
SELECT 
    au.id,
    split_part(au.email, '@', 1),
    '',
    CASE 
        WHEN au.email = 'brian.tanseng@gmail.com' THEN 'admin'::user_role
        ELSE 'staff'::user_role
    END,
    true,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
```

## Root Cause

The error occurs because:
1. The `on_auth_user_created` trigger is missing from the database
2. Users exist in `auth.users` but not in `public.profiles`
3. The authentication system expects all users to have a profile

## Complete Fix

For a more thorough fix, run the SQL in:
`/archive/fix-database-error-granting-user.sql`

## Verification

After applying the fix:
1. Try logging in again
2. Check that all users have profiles:
   ```sql
   SELECT au.email, p.id as profile_exists
   FROM auth.users au
   LEFT JOIN public.profiles p ON p.id = au.id;
   ```

## Prevention

The migration file `/supabase/migrations/20250106_add_auth_user_trigger.sql` has been created to ensure this trigger is included in future deployments.