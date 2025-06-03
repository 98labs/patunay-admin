-- Fix user deletion issues by handling foreign key constraints properly

-- 1. First, check what foreign keys reference the auth.users table
SELECT
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users'
    AND ccu.table_schema = 'auth';

-- 2. Update the profiles table foreign key to CASCADE on delete
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Update created_by and updated_by constraints to SET NULL on delete
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_created_by_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_updated_by_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- 4. Check for and update other tables that might reference auth.users
-- Update artworks table if it has user references
DO $$
BEGIN
    -- Check if artworks table exists and has user references
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'artworks' 
        AND column_name IN ('created_by', 'tag_issued_by')
    ) THEN
        -- Update created_by constraint
        ALTER TABLE public.artworks 
        DROP CONSTRAINT IF EXISTS artworks_created_by_fkey;
        
        ALTER TABLE public.artworks
        ADD CONSTRAINT artworks_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
        
        -- Update tag_issued_by constraint
        ALTER TABLE public.artworks 
        DROP CONSTRAINT IF EXISTS artworks_tag_issued_by_fkey;
        
        ALTER TABLE public.artworks
        ADD CONSTRAINT artworks_tag_issued_by_fkey 
        FOREIGN KEY (tag_issued_by) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Create a function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION delete_user_cascade(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Delete from any custom tables that reference the user
    -- (Add more DELETE statements here for other tables as needed)
    
    -- Delete user permissions if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_permissions') THEN
        DELETE FROM public.user_permissions WHERE user_id = $1;
    END IF;
    
    -- Delete user sessions if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        DELETE FROM public.user_sessions WHERE user_id = $1;
    END IF;
    
    -- The profile will be deleted automatically due to CASCADE
    -- The auth.users entry will be deleted by Supabase
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO service_role;

-- 6. Create or replace the trigger that handles user deletion to avoid conflicts
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion attempt (optional)
    RAISE NOTICE 'User % is being deleted', OLD.id;
    
    -- Return OLD to allow deletion to proceed
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Note: We don't create a BEFORE DELETE trigger on auth.users as it might interfere
-- The CASCADE constraints will handle the cleanup automatically