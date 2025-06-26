-- Fix Super User Setup
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check if your auth user exists
SELECT 'Auth User Check' as check_type,
  id, email, created_at
FROM auth.users
WHERE id = auth.uid();

-- 2. Check if you have a profile
SELECT 'Profile Check' as check_type,
  id, role, organization_id, is_active, created_at
FROM profiles
WHERE id = auth.uid();

-- 3. If no profile exists, create one (this will only run if you don't have a profile)
DO $$
DECLARE
  current_user_id uuid := auth.uid();
  default_org_id uuid;
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
  
  -- Get default organization
  SELECT id INTO default_org_id FROM organizations WHERE name = 'Default Organization';
  
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
    -- Create profile
    INSERT INTO profiles (id, role, organization_id, is_active, created_at, updated_at)
    VALUES (current_user_id, 'super_user', default_org_id, true, now(), now());
    
    RAISE NOTICE 'Created profile for user: %', user_email;
  ELSE
    -- Update existing profile to super_user
    UPDATE profiles 
    SET role = 'super_user', 
        organization_id = default_org_id,
        is_active = true,
        updated_at = now()
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Updated profile for user: %', user_email;
  END IF;
  
  -- Check if organization membership exists
  IF NOT EXISTS (SELECT 1 FROM organization_users WHERE user_id = current_user_id) THEN
    -- Create organization membership
    INSERT INTO organization_users (organization_id, user_id, role, is_primary, is_active)
    VALUES (default_org_id, current_user_id, 'super_user', true, true);
    
    RAISE NOTICE 'Created organization membership for user: %', user_email;
  ELSE
    -- Update existing membership
    UPDATE organization_users 
    SET role = 'super_user',
        is_primary = true,
        is_active = true
    WHERE user_id = current_user_id;
    
    RAISE NOTICE 'Updated organization membership for user: %', user_email;
  END IF;
  
END $$;

-- 4. Verify the fix worked
SELECT 'Verification - Profile' as check_type,
  p.id, u.email, p.role, p.organization_id, p.is_active
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = auth.uid();

SELECT 'Verification - Organization Membership' as check_type,
  ou.role, ou.is_primary, ou.is_active,
  o.name as org_name
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.user_id = auth.uid();