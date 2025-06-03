-- Fix for appraisal_appraisers table RLS policies
-- The issue: RLS is enabled but no DELETE policy exists, preventing deletion of records

-- Create DELETE policy to allow authenticated users to delete appraisal_appraisers records
CREATE POLICY "Enable delete for authenticated users" 
ON "public"."appraisal_appraisers" 
FOR DELETE 
TO "authenticated" 
USING (true);

-- Optional: If you want to restrict deletion to specific users or conditions, you can modify the USING clause
-- For example, to only allow deletion by the user who created the record:
-- USING (created_by = auth.uid())

-- Verify the policy was created
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'appraisal_appraisers' 
AND policyname = 'Enable delete for authenticated users';