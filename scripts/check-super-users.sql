-- Check if there are any super_user role users
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM profiles
WHERE role = 'super_user'
ORDER BY created_at DESC;

-- If no super users exist, you can update your current user to super_user role
-- First, find your user ID by email
-- SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

-- Then update the role
-- UPDATE profiles SET role = 'super_user' WHERE id = 'your-user-id';