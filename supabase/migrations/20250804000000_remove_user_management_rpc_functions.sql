-- Remove old RPC functions since we're using Edge Functions for user management
DROP FUNCTION IF EXISTS public.create_user_with_profile CASCADE;
DROP FUNCTION IF EXISTS public.update_user_profile CASCADE;
DROP FUNCTION IF EXISTS public.soft_delete_user CASCADE;
DROP FUNCTION IF EXISTS public.grant_user_permission CASCADE;
DROP FUNCTION IF EXISTS public.revoke_user_permission CASCADE;
DROP FUNCTION IF EXISTS public.get_user_with_role CASCADE;
DROP FUNCTION IF EXISTS public.get_organization_users_secure CASCADE;