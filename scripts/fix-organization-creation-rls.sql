-- Quick fix for organization creation issue
-- Run this script in Supabase SQL Editor to immediately fix the RLS policy issue

-- Enable super users to create organizations
CREATE POLICY "organizations_insert_policy_quick_fix" ON public.organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'super_user'
        AND is_active = true
    )
  );

-- Verify the current user is a super user
SELECT 
  auth.uid() as user_id,
  au.email,
  p.role,
  p.is_active,
  CASE 
    WHEN p.role = 'super_user' AND p.is_active = true THEN 'Yes, can create organizations'
    ELSE 'No, cannot create organizations'
  END as can_create_orgs
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id = auth.uid();