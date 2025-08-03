# Database Schema Refactoring Guide

## Overview

This document outlines the database schema improvements implemented in migration `20250804100000_refactor_schema_naming.sql`.

## Key Improvements

### 1. **Consistent Table Naming**
- Renamed `tags` → `nfc_tags` (more descriptive)
- Renamed `assets` → `artwork_images` (clearer purpose)
- All tables now use plural form consistently

### 2. **Improved Column Naming**

#### Artworks Table
- `id_number` → `catalog_number` (clearer purpose)
- `sizeUnit` → `size_unit` (consistent snake_case)
- `tag_id` → `nfc_tag_id` (clearer reference)
- `expirationDate` → `expiration_date` (consistent snake_case)
- `readWriteCount` → `nfc_scan_count` (clearer purpose)

#### NFC Tags Table (formerly tags)
- `tag_id` → `tag_uid` (avoid confusion with `id`)
- `active` → `is_active` (boolean naming convention)
- `issue_date` → `issued_at` (consistent timestamp naming)
- `tag_issued_by` → `issued_by` (simpler)

#### Artwork Images Table (formerly assets)
- `filename` → `file_name` (consistent snake_case)
- `sort_order` → `display_order` (clearer purpose)
- Added new columns: `file_size`, `mime_type`, `is_primary`

### 3. **Enhanced Audit Trail**
- Added missing `updated_by`, `deleted_at`, `deleted_by` columns
- Implemented automatic `updated_at` triggers
- Added `created_by` where missing

### 4. **Better Permission Tracking**
- Added `granted_by` to track who granted permissions
- Added `expires_at` for temporary permissions
- Added `is_active` for soft disable

### 5. **Performance Optimizations**
- Created composite indexes for common query patterns
- Added GIN index for array columns
- Created useful views for common joins

### 6. **New Views Created**
- `v_artworks_with_primary_image` - Artworks with their main image
- `v_nfc_tags_with_artwork` - NFC tags with associated artwork info

## Migration Safety

The migration is designed to be safe:
- Uses `IF EXISTS` clauses to prevent errors
- Preserves all existing data
- Updates foreign key constraints properly
- Maintains backward compatibility where possible

## Future Considerations

### Potential Additional Improvements:
1. **Standardize all timestamp columns** to use `_at` suffix
2. **Add table prefixes** for related tables (e.g., `artwork_*`)
3. **Create materialized views** for complex reporting queries
4. **Implement partitioning** for large tables (if needed)
5. **Add full-text search** capabilities

### Naming Conventions Going Forward:
- **Tables**: plural, snake_case (e.g., `user_permissions`)
- **Columns**: snake_case (e.g., `created_at`)
- **Booleans**: prefix with `is_` or `has_` (e.g., `is_active`)
- **Timestamps**: suffix with `_at` (e.g., `created_at`, `updated_at`)
- **Foreign Keys**: suffix with `_id` (e.g., `user_id`)
- **Indexes**: prefix with `idx_` (e.g., `idx_artworks_artist`)

## Code Updates Required

After applying this migration, the following code updates will be needed:

1. **Update TypeScript interfaces** to match new column names
2. **Update API queries** to use new table/column names
3. **Update Edge Functions** to reference new names
4. **Update any raw SQL queries** in the codebase

## Rollback Plan

If needed, create a reverse migration that:
1. Renames tables back to original names
2. Renames columns back to original names
3. Drops new columns and indexes
4. Restores original constraints