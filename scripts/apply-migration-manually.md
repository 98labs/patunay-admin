# Manual Migration Application Guide

Since the Supabase CLI is having connection issues, you can apply the migration manually through the Supabase Dashboard.

## Steps to Apply Migration

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard/project/bxdwavbrgrnosnuydpor
   - Navigate to the SQL Editor

2. **Copy and Execute the Migration**
   - Copy the contents of `supabase/migrations/20250626_multi_tenant_rbac_schema_safe.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify Migration Success**
   - Check that new tables were created:
     - `organizations`
     - `organization_users` 
     - `cross_org_permissions`
     - `role_permissions`
   - Verify that existing tables have new columns:
     - `profiles.organization_id`
     - `artworks.organization_id`
     - `tags.organization_id`

## Alternative: Apply in Sections

If the full migration is too large, you can apply it in smaller sections:

### Section 1: Core Tables
```sql
-- Copy and run sections 1-4 from the migration file
-- (Organizations table, role enum, profile updates)
```

### Section 2: Relationships
```sql
-- Copy and run sections 5-7 from the migration file
-- (Organization users table, foreign keys)
```

### Section 3: Permissions & Data
```sql
-- Copy and run sections 8-11 from the migration file
-- (Cross-org permissions, role permissions, seed data)
```

## Verification Queries

After applying the migration, run these queries to verify success:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_users', 'cross_org_permissions', 'role_permissions');

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('role', 'organization_id');

-- Check role permissions are loaded
SELECT role, COUNT(*) as permission_count 
FROM role_permissions 
GROUP BY role;

-- Check default organization was created
SELECT name, type FROM organizations WHERE name = 'Default Organization';
```

## Expected Results

After successful migration, you should see:
- ✅ 4 new tables created
- ✅ New columns added to existing tables
- ✅ Role permissions data loaded (24+ rows)
- ✅ Default organization created
- ✅ No data loss in existing tables

## Troubleshooting

If you encounter errors:

1. **Enum already exists**: This is normal, the migration handles it safely
2. **Column already exists**: This is normal, the migration checks for existing columns
3. **Permission denied**: Make sure you're using a user with sufficient privileges
4. **Foreign key constraint**: Check that referenced tables exist first

## Next Steps

Once the migration is applied successfully:
1. Run the sample data script: `scripts/create-sample-users.sql`
2. Test the new role system using the frontend
3. Use the Migration Verification component in the app
4. Follow the test scenarios in `docs/RBAC_TEST_SCENARIOS.md`