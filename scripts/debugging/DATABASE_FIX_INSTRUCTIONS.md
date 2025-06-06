# Database Fix Instructions

## Problem Summary
The `add_artwork` function had several mismatches between its declared return type and the actual query:
1. Returns `idnumber` but selects from `id_number` column
2. Declares `collector` field in return type but doesn't select it
3. `bulk_add_artwork` tries to insert into `idnumber` column which doesn't exist

## Solution Applied

### 1. SQL Migration
Apply the migration in `/archive/fix-add-artwork-complete.sql` to your database:
```sql
-- This migration fixes:
-- - Maps id_number to idnumber in the return value
-- - Removes the unused collector field from RETURNS TABLE
-- - Fixes bulk_add_artwork to use id_number column
-- - Adds proper COALESCE handling for profile names
```

### 2. Frontend Code Update
The `handleAddArtwork.ts` file has been updated to expect `idnumber` from the database response:
```typescript
id_number: result.idnumber,  // Database returns idnumber, not id_number
```

## Steps to Apply the Fix

1. **Apply the SQL migration**:
   ```bash
   # Using psql or your preferred SQL client
   psql -U your_user -d your_database -f archive/fix-add-artwork-complete.sql
   ```

2. **Verify the function**:
   ```sql
   -- Test the function returns the correct structure
   SELECT * FROM add_artwork(
     'TEST-001',           -- p_idnumber
     'Test Artwork',       -- p_title
     'Test Description',   -- p_description
     100,                  -- p_height
     80,                   -- p_width
     'cm',                 -- p_size_unit
     'Test Artist',        -- p_artist
     '2024',              -- p_year
     'Oil on Canvas',      -- p_medium
     NULL,                 -- p_tag_id (optional)
     NULL,                 -- p_expiration_date (optional)
     0,                    -- p_read_write_count
     NULL,                 -- p_assets (optional)
     'Test Provenance',    -- p_provenance
     '[]'::jsonb,         -- p_bibliography
     '[]'::jsonb          -- p_collectors
   );
   ```

3. **Test the Register Artwork flow**:
   - Navigate to Register Artwork page
   - Fill in all required fields
   - Submit the form
   - Verify the artwork is created successfully

## What Changed

### Database Function
- `add_artwork` now correctly maps `id_number` column to `idnumber` in return
- Removed unused `collector` field from function signature
- Added COALESCE for profile names to prevent null errors
- Fixed `bulk_add_artwork` to use correct column name

### Frontend Code
- `handleAddArtwork.ts` now expects `idnumber` from database response
- Maintains backward compatibility with rest of the codebase

## Notes
- The artworks table still uses `id_number` column internally
- The function returns `idnumber` for compatibility with existing code
- All other queries (getArtworks, etc.) work directly with table structure