-- Comprehensive diagnostic for user creation issues

-- 1. Check if we can access the auth schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        RAISE NOTICE 'Auth schema exists';
    ELSE
        RAISE NOTICE 'ERROR: Auth schema does not exist!';
    END IF;
END $$;

-- 2. Check auth.users table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE NOTICE 'Auth.users table exists';
        
        -- Check for any blocking triggers
        PERFORM COUNT(*) FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgenabled != 'D';
        
        RAISE NOTICE 'Number of active triggers on auth.users: %', count(*);
    ELSE
        RAISE NOTICE 'ERROR: Auth.users table does not exist!';
    END IF;
END $$;

-- 3. Check profiles table and constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY contype, conname;

-- 4. Check for any functions that might interfere
SELECT 
    proname AS function_name,
    provolatile AS volatility,
    prosecdef AS security_definer
FROM pg_proc
WHERE proname LIKE '%user%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- 5. Test if we can insert into profiles directly
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
BEGIN
    -- Try to insert a test profile
    INSERT INTO public.profiles (id, created_at, role, is_active)
    VALUES (test_id, NOW(), 'staff', true);
    
    -- If successful, delete it
    DELETE FROM public.profiles WHERE id = test_id;
    
    RAISE NOTICE 'SUCCESS: Can insert/delete profiles directly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR inserting profile: %', SQLERRM;
END $$;

-- 6. Check RLS status on all relevant tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END AS rls_status
FROM pg_tables
WHERE schemaname IN ('public', 'auth')
AND tablename IN ('users', 'profiles')
ORDER BY schemaname, tablename;

-- 7. List all policies on profiles table
SELECT 
    pol.polname AS policy_name,
    pol.polcmd AS command,
    pol.polroles::regrole[] AS roles,
    CASE pol.polpermissive 
        WHEN TRUE THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END AS type
FROM pg_policy pol
WHERE pol.polrelid = 'public.profiles'::regclass
ORDER BY pol.polname;

-- 8. Check for database event triggers that might block operations
SELECT 
    evtname AS trigger_name,
    evtevent AS event,
    evtenabled AS enabled,
    evtfoid::regproc AS function_name
FROM pg_event_trigger
WHERE evtenabled != 'D'
ORDER BY evtname;